/* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set sts=2 sw=2 et tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

ChromeUtils.defineModuleGetter(
  this,
  "AppConstants",
  "resource://gre/modules/AppConstants.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "Services",
  "resource://gre/modules/Services.jsm"
);

XPCOMUtils.defineLazyServiceGetter(
  this,
  "aboutNewTabService",
  "@mozilla.org/browser/aboutnewtab-service;1",
  "nsIAboutNewTabService"
);

var { ExtensionPreferencesManager } = ChromeUtils.import(
  "resource://gre/modules/ExtensionPreferencesManager.jsm"
);

var { ExtensionError } = ExtensionUtils;
var { getSettingsAPI } = ExtensionPreferencesManager;

const HOMEPAGE_OVERRIDE_SETTING = "homepage_override";
const HOMEPAGE_URL_PREF = "browser.startup.homepage";
const URL_STORE_TYPE = "url_overrides";
const NEW_TAB_OVERRIDE_SETTING = "newTabURL";

const PERM_DENY_ACTION = Services.perms.DENY_ACTION;

// Add settings objects for supported APIs to the preferences manager.
ExtensionPreferencesManager.addSetting("allowPopupsForUserEvents", {
  prefNames: ["dom.popup_allowed_events"],

  setCallback(value) {
    let returnObj = {};
    // If the value is true, then reset the pref, otherwise set it to "".
    returnObj[this.prefNames[0]] = value ? undefined : "";
    return returnObj;
  },
});

ExtensionPreferencesManager.addSetting("cacheEnabled", {
  prefNames: ["browser.cache.disk.enable", "browser.cache.memory.enable"],

  setCallback(value) {
    let returnObj = {};
    for (let pref of this.prefNames) {
      returnObj[pref] = value;
    }
    return returnObj;
  },
});

ExtensionPreferencesManager.addSetting("closeTabsByDoubleClick", {
  prefNames: ["browser.tabs.closeTabByDblclick"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("contextMenuShowEvent", {
  prefNames: ["ui.context_menus.after_mouseup"],

  setCallback(value) {
    return { [this.prefNames[0]]: value === "mouseup" };
  },
});

ExtensionPreferencesManager.addSetting("ftpProtocolEnabled", {
  prefNames: ["network.ftp.enabled"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("imageAnimationBehavior", {
  prefNames: ["image.animation_mode"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("newTabPosition", {
  prefNames: [
    "browser.tabs.insertRelatedAfterCurrent",
    "browser.tabs.insertAfterCurrent",
  ],

  setCallback(value) {
    return {
      "browser.tabs.insertAfterCurrent": value === "afterCurrent",
      "browser.tabs.insertRelatedAfterCurrent": value === "relatedAfterCurrent",
    };
  },
});

ExtensionPreferencesManager.addSetting("openBookmarksInNewTabs", {
  prefNames: ["browser.tabs.loadBookmarksInTabs"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("openSearchResultsInNewTabs", {
  prefNames: ["browser.search.openintab"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("openUrlbarResultsInNewTabs", {
  prefNames: ["browser.urlbar.openintab"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("webNotificationsDisabled", {
  prefNames: ["permissions.default.desktop-notification"],

  setCallback(value) {
    return { [this.prefNames[0]]: value ? PERM_DENY_ACTION : undefined };
  },
});

ExtensionPreferencesManager.addSetting("overrideDocumentColors", {
  prefNames: ["browser.display.document_color_use"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

ExtensionPreferencesManager.addSetting("useDocumentFonts", {
  prefNames: ["browser.display.use_document_fonts"],

  setCallback(value) {
    return { [this.prefNames[0]]: value };
  },
});

this.browserSettings = class extends ExtensionAPI {
  getAPI(context) {
    let { extension } = context;
    return {
      browserSettings: {
        allowPopupsForUserEvents: getSettingsAPI({
          context,
          name: "allowPopupsForUserEvents",
          callback() {
            return Services.prefs.getCharPref("dom.popup_allowed_events") != "";
          },
        }),
        cacheEnabled: getSettingsAPI({
          context,
          name: "cacheEnabled",
          callback() {
            return (
              Services.prefs.getBoolPref("browser.cache.disk.enable") &&
              Services.prefs.getBoolPref("browser.cache.memory.enable")
            );
          },
        }),
        closeTabsByDoubleClick: getSettingsAPI({
          context,
          name: "closeTabsByDoubleClick",
          callback() {
            return Services.prefs.getBoolPref(
              "browser.tabs.closeTabByDblclick"
            );
          },
          validate() {
            if (AppConstants.platform == "android") {
              throw new ExtensionError(
                `android is not a supported platform for the closeTabsByDoubleClick setting.`
              );
            }
          },
        }),
        contextMenuShowEvent: Object.assign(
          getSettingsAPI({
            context,
            name: "contextMenuShowEvent",
            callback() {
              if (AppConstants.platform === "win") {
                return "mouseup";
              }
              let prefValue = Services.prefs.getBoolPref(
                "ui.context_menus.after_mouseup",
                null
              );
              return prefValue ? "mouseup" : "mousedown";
            },
          }),
          {
            set: details => {
              if (!["mouseup", "mousedown"].includes(details.value)) {
                throw new ExtensionError(
                  `${
                    details.value
                  } is not a valid value for contextMenuShowEvent.`
                );
              }
              if (
                AppConstants.platform === "android" ||
                (AppConstants.platform === "win" &&
                  details.value === "mousedown")
              ) {
                return false;
              }
              return ExtensionPreferencesManager.setSetting(
                extension.id,
                "contextMenuShowEvent",
                details.value
              );
            },
          }
        ),
        ftpProtocolEnabled: getSettingsAPI({
          context,
          name: "ftpProtocolEnabled",
          callback() {
            return Services.prefs.getBoolPref("network.ftp.enabled");
          },
        }),
        homepageOverride: getSettingsAPI({
          context,
          name: HOMEPAGE_OVERRIDE_SETTING,
          callback() {
            return Services.prefs.getStringPref(HOMEPAGE_URL_PREF);
          },
          readOnly: true,
          onChange: new ExtensionCommon.EventManager({
            context,
            name: `${HOMEPAGE_URL_PREF}.onChange`,
            register: fire => {
              let listener = () => {
                fire.async({
                  levelOfControl: "not_controllable",
                  value: Services.prefs.getStringPref(HOMEPAGE_URL_PREF),
                });
              };
              Services.prefs.addObserver(HOMEPAGE_URL_PREF, listener);
              return () => {
                Services.prefs.removeObserver(HOMEPAGE_URL_PREF, listener);
              };
            },
          }).api(),
        }),
        imageAnimationBehavior: getSettingsAPI({
          context,
          name: "imageAnimationBehavior",
          callback() {
            return Services.prefs.getCharPref("image.animation_mode");
          },
        }),
        newTabPosition: getSettingsAPI({
          context,
          name: "newTabPosition",
          callback() {
            if (Services.prefs.getBoolPref("browser.tabs.insertAfterCurrent")) {
              return "afterCurrent";
            }
            if (
              Services.prefs.getBoolPref(
                "browser.tabs.insertRelatedAfterCurrent"
              )
            ) {
              return "relatedAfterCurrent";
            }
            return "atEnd";
          },
        }),
        newTabPageOverride: getSettingsAPI({
          context,
          name: NEW_TAB_OVERRIDE_SETTING,
          callback() {
            return aboutNewTabService.newTabURL;
          },
          storeType: URL_STORE_TYPE,
          readOnly: true,
          onChange: new ExtensionCommon.EventManager({
            context,
            name: `${NEW_TAB_OVERRIDE_SETTING}.onChange`,
            register: fire => {
              let listener = (text, id) => {
                fire.async({
                  levelOfControl: "not_controllable",
                  value: aboutNewTabService.newTabURL,
                });
              };
              Services.obs.addObserver(listener, "newtab-url-changed");
              return () => {
                Services.obs.removeObserver(listener, "newtab-url-changed");
              };
            },
          }).api(),
        }),
        openBookmarksInNewTabs: getSettingsAPI({
          context,
          name: "openBookmarksInNewTabs",
          callback() {
            return Services.prefs.getBoolPref(
              "browser.tabs.loadBookmarksInTabs"
            );
          },
        }),
        openSearchResultsInNewTabs: getSettingsAPI({
          context,
          name: "openSearchResultsInNewTabs",
          callback() {
            return Services.prefs.getBoolPref("browser.search.openintab");
          },
        }),
        openUrlbarResultsInNewTabs: getSettingsAPI({
          context,
          name: "openUrlbarResultsInNewTabs",
          callback() {
            return Services.prefs.getBoolPref("browser.urlbar.openintab");
          },
        }),
        webNotificationsDisabled: getSettingsAPI({
          context,
          name: "webNotificationsDisabled",
          callback() {
            let prefValue = Services.prefs.getIntPref(
              "permissions.default.desktop-notification",
              null
            );
            return prefValue === PERM_DENY_ACTION;
          },
        }),
        overrideDocumentColors: Object.assign(
          getSettingsAPI({
            context,
            name: "overrideDocumentColors",
            callback() {
              let prefValue = Services.prefs.getIntPref(
                "browser.display.document_color_use"
              );
              if (prefValue === 1) {
                return "never";
              } else if (prefValue === 2) {
                return "always";
              }
              return "high-contrast-only";
            },
          }),
          {
            set: details => {
              if (
                !["never", "always", "high-contrast-only"].includes(
                  details.value
                )
              ) {
                throw new ExtensionError(
                  `${
                    details.value
                  } is not a valid value for overrideDocumentColors.`
                );
              }
              let prefValue = 0; // initialize to 0 - auto/high-contrast-only
              if (details.value === "never") {
                prefValue = 1;
              } else if (details.value === "always") {
                prefValue = 2;
              }
              return ExtensionPreferencesManager.setSetting(
                extension.id,
                "overrideDocumentColors",
                prefValue
              );
            },
          }
        ),
        useDocumentFonts: Object.assign(
          getSettingsAPI({
            context,
            name: "useDocumentFonts",
            callback() {
              return (
                Services.prefs.getIntPref(
                  "browser.display.use_document_fonts"
                ) !== 0
              );
            },
          }),
          {
            set: details => {
              if (typeof details.value !== "boolean") {
                throw new ExtensionError(
                  `${details.value} is not a valid value for useDocumentFonts.`
                );
              }
              return ExtensionPreferencesManager.setSetting(
                extension.id,
                "useDocumentFonts",
                Number(details.value)
              );
            },
          }
        ),
      },
    };
  }
};
