/* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set sts=2 sw=2 et tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

ChromeUtils.defineModuleGetter(
  this,
  "ExtensionTelemetry",
  "resource://gre/modules/ExtensionTelemetry.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "PageActions",
  "resource:///modules/PageActions.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "PanelPopup",
  "resource:///modules/ExtensionPopups.jsm"
);

var { DefaultWeakMap } = ExtensionUtils;

var { PageActionBase } = ChromeUtils.import(
  "resource://gre/modules/ExtensionActions.jsm"
);

// WeakMap[Extension -> PageAction]
let pageActionMap = new WeakMap();

class PageAction extends PageActionBase {
  constructor(extension, buttonDelegate) {
    let tabContext = new TabContext(tab => this.getContextData(null));
    super(tabContext, extension);
    this.buttonDelegate = buttonDelegate;
  }

  updateOnChange(target) {
    this.buttonDelegate.updateButton(target.ownerGlobal);
  }

  getTab(tabId) {
    if (tabId !== null) {
      return tabTracker.getTab(tabId);
    }
    return null;
  }
}

this.pageAction = class extends ExtensionAPI {
  static for(extension) {
    return pageActionMap.get(extension);
  }

  async onManifestEntry(entryName) {
    let { extension } = this;
    let options = extension.manifest.page_action;

    this.action = new PageAction(extension, this);
    await this.action.loadIconData();

    let widgetId = makeWidgetId(extension.id);
    this.id = widgetId + "-page-action";

    this.tabManager = extension.tabManager;

    this.browserStyle = options.browser_style;

    pageActionMap.set(extension, this);

    this.lastValues = new DefaultWeakMap(() => ({}));

    if (!this.browserPageAction) {
      let onPlacedHandler = (buttonNode, isPanel) => {
        // eslint-disable-next-line mozilla/balanced-listeners
        buttonNode.addEventListener("auxclick", event => {
          if (event.button !== 1 || event.target.disabled) {
            return;
          }

          this.lastClickInfo = {
            button: event.button,
            modifiers: clickModifiersFromEvent(event),
          };

          // The panel is not automatically closed when middle-clicked.
          if (isPanel) {
            buttonNode.closest("#pageActionPanel").hidePopup();
          }
          let window = event.target.ownerGlobal;
          let tab = window.gBrowser.selectedTab;
          this.emit("click", tab);
        });
      };

      this.browserPageAction = PageActions.addAction(
        new PageActions.Action({
          id: widgetId,
          extensionID: extension.id,
          title: this.action.getProperty(null, "title"),
          iconURL: this.action.getProperty(null, "title"),
          pinnedToUrlbar: this.action.getPinned(),
          disabled: !this.action.getProperty(null, "enabled"),
          onCommand: (event, buttonNode) => {
            this.lastClickInfo = {
              button: event.button || 0,
              modifiers: clickModifiersFromEvent(event),
            };
            this.handleClick(event.target.ownerGlobal);
          },
          onBeforePlacedInWindow: browserWindow => {
            if (
              this.extension.hasPermission("menus") ||
              this.extension.hasPermission("contextMenus")
            ) {
              browserWindow.document.addEventListener("popupshowing", this);
            }
          },
          onPlacedInPanel: buttonNode => onPlacedHandler(buttonNode, true),
          onPlacedInUrlbar: buttonNode => onPlacedHandler(buttonNode, false),
          onRemovedFromWindow: browserWindow => {
            browserWindow.document.removeEventListener("popupshowing", this);
          },
        })
      );

      // If the page action is only enabled in some URLs, do pattern matching in
      // the active tabs and update the button if necessary.
      if (this.action.getProperty(null, "enabled") === undefined) {
        for (let window of windowTracker.browserWindows()) {
          let tab = window.gBrowser.selectedTab;
          if (this.action.isShownForTab(tab)) {
            this.updateButton(window);
          }
        }
      }
    }
  }

  onShutdown(isAppShutdown) {
    pageActionMap.delete(this.extension);
    this.action.onShutdown();

    // Removing the browser page action causes PageActions to forget about it
    // across app restarts, so don't remove it on app shutdown, but do remove
    // it on all other shutdowns since there's no guarantee the action will be
    // coming back.
    if (!isAppShutdown && this.browserPageAction) {
      this.browserPageAction.remove();
      this.browserPageAction = null;
    }
  }

  // Updates the page action button in the given window to reflect the
  // properties of the currently selected tab:
  //
  // Updates "tooltiptext" and "aria-label" to match "title" property.
  // Updates "image" to match the "icon" property.
  // Enables or disables the icon, based on the "enabled" and "patternMatching" properties.
  updateButton(window) {
    let tab = window.gBrowser.selectedTab;
    let tabData = this.action.getContextData(tab);
    let last = this.lastValues.get(window);

    window.requestAnimationFrame(() => {
      // If we get called just before shutdown, we might have been destroyed by
      // this point.
      if (!this.browserPageAction) {
        return;
      }

      let title = tabData.title || this.extension.name;
      if (last.title !== title) {
        this.browserPageAction.setTitle(title, window);
        last.title = title;
      }

      let enabled =
        tabData.enabled != null ? tabData.enabled : tabData.patternMatching;
      if (last.enabled !== enabled) {
        this.browserPageAction.setDisabled(!enabled, window);
        last.enabled = enabled;
      }

      let icon = tabData.icon;
      if (last.icon !== icon) {
        this.browserPageAction.setIconURL(icon, window);
        last.icon = icon;
      }
    });
  }

  /**
   * Triggers this page action for the given window, with the same effects as
   * if it were clicked by a user.
   *
   * This has no effect if the page action is hidden for the selected tab.
   *
   * @param {Window} window
   */
  triggerAction(window) {
    if (this.action.isShownForTab(window.gBrowser.selectedTab)) {
      this.lastClickInfo = { button: 0, modifiers: [] };
      this.handleClick(window);
    }
  }

  handleEvent(event) {
    switch (event.type) {
      case "popupshowing":
        const menu = event.target;
        const trigger = menu.triggerNode;

        if (
          menu.id === "pageActionContextMenu" &&
          trigger &&
          trigger.getAttribute("actionid") === this.browserPageAction.id &&
          !this.browserPageAction.getDisabled(trigger.ownerGlobal)
        ) {
          global.actionContextMenu({
            extension: this.extension,
            onPageAction: true,
            menu: menu,
          });
        }
        break;
    }
  }

  // Handles a click event on the page action button for the given
  // window.
  // If the page action has a |popup| property, a panel is opened to
  // that URL. Otherwise, a "click" event is emitted, and dispatched to
  // the any click listeners in the add-on.
  async handleClick(window) {
    const { extension } = this;

    ExtensionTelemetry.pageActionPopupOpen.stopwatchStart(extension, this);
    let tab = window.gBrowser.selectedTab;
    let popupURL = this.action.getProperty(tab, "popup");

    this.tabManager.addActiveTabPermission(tab);

    // If the widget has a popup URL defined, we open a popup, but do not
    // dispatch a click event to the extension.
    // If it has no popup URL defined, we dispatch a click event, but do not
    // open a popup.
    if (popupURL) {
      if (this.popupNode && this.popupNode.panel.state !== "closed") {
        // The panel is being toggled closed.
        ExtensionTelemetry.pageActionPopupOpen.stopwatchCancel(extension, this);
        window.BrowserPageActions.togglePanelForAction(
          this.browserPageAction,
          this.popupNode.panel
        );
        return;
      }

      this.popupNode = new PanelPopup(
        extension,
        window.document,
        popupURL,
        this.browserStyle
      );
      // Remove popupNode when it is closed.
      this.popupNode.panel.addEventListener(
        "popuphiding",
        () => {
          this.popupNode = undefined;
        },
        { once: true }
      );
      await this.popupNode.contentReady;
      window.BrowserPageActions.togglePanelForAction(
        this.browserPageAction,
        this.popupNode.panel
      );
      ExtensionTelemetry.pageActionPopupOpen.stopwatchFinish(extension, this);
    } else {
      ExtensionTelemetry.pageActionPopupOpen.stopwatchCancel(extension, this);
      this.emit("click", tab);
    }
  }

  getAPI(context) {
    const { extension } = context;
    const { tabManager } = extension;
    const { action } = this;

    return {
      pageAction: {
        ...action.api(context),

        onClicked: new EventManager({
          context,
          name: "pageAction.onClicked",
          inputHandling: true,
          register: fire => {
            let listener = (evt, tab) => {
              context.withPendingBrowser(tab.linkedBrowser, () =>
                fire.sync(tabManager.convert(tab), this.lastClickInfo)
              );
            };

            this.on("click", listener);
            return () => {
              this.off("click", listener);
            };
          },
        }).api(),

        openPopup: () => {
          let window = windowTracker.topWindow;
          this.triggerAction(window);
        },
      },
    };
  }
};

global.pageActionFor = this.pageAction.for;
