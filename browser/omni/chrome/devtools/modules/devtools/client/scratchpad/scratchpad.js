/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Original version history can be found here:
 * https://github.com/mozilla/workspace
 *
 * Copied and relicensed from the Public Domain.
 * See bug 653934 for details.
 * https://bugzilla.mozilla.org/show_bug.cgi?id=653934
 */

// Via index.xul
/* import-globals-from ../../../toolkit/content/globalOverlay.js */
/* import-globals-from ../../../toolkit/content/editMenuOverlay.js */

"use strict";

const SCRATCHPAD_CONTEXT_CONTENT = 1;
const SCRATCHPAD_CONTEXT_BROWSER = 2;
const BUTTON_POSITION_SAVE = 0;
const BUTTON_POSITION_CANCEL = 1;
const BUTTON_POSITION_DONT_SAVE = 2;
const BUTTON_POSITION_REVERT = 0;
const EVAL_FUNCTION_TIMEOUT = 1000; // milliseconds

const MAXIMUM_FONT_SIZE = 96;
const MINIMUM_FONT_SIZE = 6;
const NORMAL_FONT_SIZE = 12;

const SCRATCHPAD_L10N = "chrome://devtools/locale/scratchpad.properties";
const DEVTOOLS_CHROME_ENABLED = "devtools.chrome.enabled";
const PREF_RECENT_FILES_MAX = "devtools.scratchpad.recentFilesMax";
const SHOW_LINE_NUMBERS = "devtools.scratchpad.lineNumbers";
const WRAP_TEXT = "devtools.scratchpad.wrapText";
const SHOW_TRAILING_SPACE = "devtools.scratchpad.showTrailingSpace";
const EDITOR_FONT_SIZE = "devtools.scratchpad.editorFontSize";
const ENABLE_AUTOCOMPLETION = "devtools.scratchpad.enableAutocompletion";
const FALLBACK_CHARSET_LIST = "intl.fallbackCharsetList.ISO-8859-1";

const VARIABLES_VIEW_URL =
  "chrome://devtools/content/shared/widgets/VariablesView.xul";

const { require, loader } = ChromeUtils.import(
  "resource://devtools/shared/Loader.jsm"
);

const Editor = require("devtools/client/shared/sourceeditor/editor");
const TargetFactory = require("devtools/client/framework/target").TargetFactory;
const EventEmitter = require("devtools/shared/event-emitter");
const DevToolsUtils = require("devtools/shared/DevToolsUtils");
const Services = require("Services");
const { gDevTools } = require("devtools/client/framework/devtools");
const { extend } = require("devtools/shared/extend");

const { XPCOMUtils } = require("resource://gre/modules/XPCOMUtils.jsm");
const { NetUtil } = require("resource://gre/modules/NetUtil.jsm");
const {
  ScratchpadManager,
} = require("resource://devtools/client/scratchpad/scratchpad-manager.jsm");
const { OS } = require("resource://gre/modules/osfile.jsm");
const { Reflect } = require("resource://gre/modules/reflect.jsm");

// Use privileged promise in panel documents to prevent having them to freeze
// during toolbox destruction. See bug 1402779.
// eslint-disable-next-line no-unused-vars
const Promise = require("Promise");

XPCOMUtils.defineConstant(
  this,
  "SCRATCHPAD_CONTEXT_CONTENT",
  SCRATCHPAD_CONTEXT_CONTENT
);
XPCOMUtils.defineConstant(
  this,
  "SCRATCHPAD_CONTEXT_BROWSER",
  SCRATCHPAD_CONTEXT_BROWSER
);
XPCOMUtils.defineConstant(this, "BUTTON_POSITION_SAVE", BUTTON_POSITION_SAVE);
XPCOMUtils.defineConstant(
  this,
  "BUTTON_POSITION_CANCEL",
  BUTTON_POSITION_CANCEL
);
XPCOMUtils.defineConstant(
  this,
  "BUTTON_POSITION_DONT_SAVE",
  BUTTON_POSITION_DONT_SAVE
);
XPCOMUtils.defineConstant(
  this,
  "BUTTON_POSITION_REVERT",
  BUTTON_POSITION_REVERT
);

ChromeUtils.defineModuleGetter(
  this,
  "VariablesView",
  "resource://devtools/client/shared/widgets/VariablesView.jsm"
);

ChromeUtils.defineModuleGetter(
  this,
  "VariablesViewController",
  "resource://devtools/client/shared/widgets/VariablesViewController.jsm"
);

loader.lazyRequireGetter(
  this,
  "DebuggerServer",
  "devtools/server/debugger-server",
  true
);

loader.lazyRequireGetter(
  this,
  "DebuggerClient",
  "devtools/shared/client/debugger-client",
  true
);
loader.lazyRequireGetter(
  this,
  "EnvironmentClient",
  "devtools/shared/client/environment-client"
);
loader.lazyRequireGetter(
  this,
  "ObjectClient",
  "devtools/shared/client/object-client"
);
loader.lazyRequireGetter(
  this,
  "BrowserConsoleManager",
  "devtools/client/webconsole/browser-console-manager",
  true
);
loader.lazyRequireGetter(
  this,
  "openDocLink",
  "devtools/client/shared/link",
  true
);

XPCOMUtils.defineLazyGetter(this, "REMOTE_TIMEOUT", () =>
  Services.prefs.getIntPref("devtools.debugger.remote-timeout")
);

ChromeUtils.defineModuleGetter(
  this,
  "ShortcutUtils",
  "resource://gre/modules/ShortcutUtils.jsm"
);

ChromeUtils.defineModuleGetter(
  this,
  "Reflect",
  "resource://gre/modules/reflect.jsm"
);

var WebConsoleUtils = require("devtools/client/webconsole/utils").Utils;

/**
 * The scratchpad object handles the Scratchpad window functionality.
 */
var Scratchpad = {
  _instanceId: null,
  _initialWindowTitle: document.title,
  _dirty: false,

  /**
   * Check if provided string is a mode-line and, if it is, return an
   * object with its values.
   *
   * @param string aLine
   * @return string
   */
  _scanModeLine: function SP__scanModeLine(aLine = "") {
    aLine = aLine.trim();

    const obj = {};
    const ch1 = aLine.charAt(0);
    const ch2 = aLine.charAt(1);

    if (ch1 !== "/" || (ch2 !== "*" && ch2 !== "/")) {
      return obj;
    }

    aLine = aLine
      .replace(/^\/\//, "")
      .replace(/^\/\*/, "")
      .replace(/\*\/$/, "");

    aLine.split(",").forEach(pair => {
      const [key, val] = pair.split(":");

      if (key && val) {
        obj[key.trim()] = val.trim();
      }
    });

    return obj;
  },

  /**
   * Add the event listeners for popupshowing events.
   */
  _setupPopupShowingListeners: function SP_setupPopupShowing() {
    const elementIDs = ["sp-menu_editpopup", "scratchpad-text-popup"];

    for (const elementID of elementIDs) {
      const elem = document.getElementById(elementID);
      if (elem) {
        elem.addEventListener("popupshowing", function() {
          goUpdateGlobalEditMenuItems();
          const commands = [
            "cmd_undo",
            "cmd_redo",
            "cmd_delete",
            "cmd_findAgain",
          ];
          commands.forEach(goUpdateCommand);
        });
      }
    }
  },

  /**
   * Add the event event listeners for command events.
   */
  _setupCommandListeners: function SP_setupCommands() {
    const commands = {
      cmd_find: () => {
        goDoCommand("cmd_find");
      },
      cmd_findAgain: () => {
        goDoCommand("cmd_findAgain");
      },
      cmd_gotoLine: () => {
        goDoCommand("cmd_gotoLine");
      },
      "sp-cmd-newWindow": () => {
        Scratchpad.openScratchpad();
      },
      "sp-cmd-openFile": () => {
        Scratchpad.openFile();
      },
      "sp-cmd-clearRecentFiles": () => {
        Scratchpad.clearRecentFiles();
      },
      "sp-cmd-save": () => {
        Scratchpad.saveFile();
      },
      "sp-cmd-saveas": () => {
        Scratchpad.saveFileAs();
      },
      "sp-cmd-revert": () => {
        Scratchpad.promptRevert();
      },
      "sp-cmd-close": () => {
        Scratchpad.close();
      },
      "sp-cmd-run": () => {
        Scratchpad.run();
      },
      "sp-cmd-inspect": () => {
        Scratchpad.inspect();
      },
      "sp-cmd-display": () => {
        Scratchpad.display();
      },
      "sp-cmd-contentContext": () => {
        Scratchpad.setContentContext();
      },
      "sp-cmd-browserContext": () => {
        Scratchpad.setBrowserContext();
      },
      "sp-cmd-reloadAndRun": () => {
        Scratchpad.reloadAndRun();
      },
      "sp-cmd-evalFunction": () => {
        Scratchpad.evalTopLevelFunction();
      },
      "sp-cmd-errorConsole": () => {
        Scratchpad.openErrorConsole();
      },
      "sp-cmd-webConsole": () => {
        Scratchpad.openWebConsole();
      },
      "sp-cmd-documentationLink": () => {
        Scratchpad.openDocumentationPage();
      },
      "sp-cmd-hideSidebar": () => {
        Scratchpad.sidebar.hide();
      },
      "sp-cmd-line-numbers": () => {
        Scratchpad.toggleEditorOption("lineNumbers", SHOW_LINE_NUMBERS);
      },
      "sp-cmd-wrap-text": () => {
        Scratchpad.toggleEditorOption("lineWrapping", WRAP_TEXT);
      },
      "sp-cmd-highlight-trailing-space": () => {
        Scratchpad.toggleEditorOption("showTrailingSpace", SHOW_TRAILING_SPACE);
      },
      "sp-cmd-larger-font": () => {
        Scratchpad.increaseFontSize();
      },
      "sp-cmd-smaller-font": () => {
        Scratchpad.decreaseFontSize();
      },
      "sp-cmd-normal-font": () => {
        Scratchpad.normalFontSize();
      },
    };

    for (const command in commands) {
      const elem = document.getElementById(command);
      if (elem) {
        elem.addEventListener("command", commands[command]);
      }
    }
  },

  /**
   * Check or uncheck view menu items according to stored preferences.
   */
  _updateViewMenuItems: function SP_updateViewMenuItems() {
    this._updateViewMenuItem(SHOW_LINE_NUMBERS, "sp-menu-line-numbers");
    this._updateViewMenuItem(WRAP_TEXT, "sp-menu-word-wrap");
    this._updateViewMenuItem(
      SHOW_TRAILING_SPACE,
      "sp-menu-highlight-trailing-space"
    );
    this._updateViewFontMenuItem(MINIMUM_FONT_SIZE, "sp-cmd-smaller-font");
    this._updateViewFontMenuItem(MAXIMUM_FONT_SIZE, "sp-cmd-larger-font");
  },

  /**
   * Check or uncheck view menu item according to stored preferences.
   */
  _updateViewMenuItem: function SP_updateViewMenuItem(preferenceName, menuId) {
    const checked = Services.prefs.getBoolPref(preferenceName);
    if (checked) {
      document.getElementById(menuId).setAttribute("checked", true);
    } else {
      document.getElementById(menuId).removeAttribute("checked");
    }
  },

  /**
   * Disable view menu item if the stored font size is equals to the given one.
   */
  _updateViewFontMenuItem: function SP_updateViewFontMenuItem(
    fontSize,
    commandId
  ) {
    const prefFontSize = Services.prefs.getIntPref(EDITOR_FONT_SIZE);
    if (prefFontSize === fontSize) {
      document.getElementById(commandId).setAttribute("disabled", true);
    }
  },

  /**
   * The script execution context. This tells Scratchpad in which context the
   * script shall execute.
   *
   * Possible values:
   *   - SCRATCHPAD_CONTEXT_CONTENT to execute code in the context of the current
   *   tab content window object.
   *   - SCRATCHPAD_CONTEXT_BROWSER to execute code in the context of the
   *   currently active chrome window object.
   */
  executionContext: SCRATCHPAD_CONTEXT_CONTENT,

  /**
   * Tells if this Scratchpad is initialized and ready for use.
   * @boolean
   * @see addObserver
   */
  initialized: false,

  /**
   * Returns the 'dirty' state of this Scratchpad.
   */
  get dirty() {
    const clean = this.editor && this.editor.isClean();
    return this._dirty || !clean;
  },

  /**
   * Sets the 'dirty' state of this Scratchpad.
   */
  set dirty(aValue) {
    this._dirty = aValue;
    if (!aValue && this.editor) {
      this.editor.setClean();
    }
    this._updateTitle();
  },

  /**
   * Hide the menu bar.
   */
  hideMenu: function SP_hideMenu() {
    document.getElementById("sp-menu-toolbar").style.display = "none";
  },

  /**
   * Show the menu bar.
   */
  showMenu: function SP_showMenu() {
    document.getElementById("sp-menu-toolbar").style.display = "";
  },

  /**
   * Get the editor content, in the given range. If no range is given you get
   * the entire editor content.
   *
   * @param number [aStart=0]
   *        Optional, start from the given offset.
   * @param number [aEnd=content char count]
   *        Optional, end offset for the text you want. If this parameter is not
   *        given, then the text returned goes until the end of the editor
   *        content.
   * @return string
   *         The text in the given range.
   */
  getText: function SP_getText(aStart, aEnd) {
    var value = this.editor.getText();
    return value.slice(aStart || 0, aEnd || value.length);
  },

  /**
   * Set the filename in the scratchpad UI and object
   *
   * @param string aFilename
   *        The new filename
   */
  setFilename: function SP_setFilename(aFilename) {
    this.filename = aFilename;
    this._updateTitle();
  },

  /**
   * Update the Scratchpad window title based on the current state.
   * @private
   */
  _updateTitle: function SP__updateTitle() {
    let title = this.filename || this._initialWindowTitle;

    if (this.dirty) {
      title = "*" + title;
    }

    document.title = title;
  },

  /**
   * Get the current state of the scratchpad. Called by the
   * Scratchpad Manager for session storing.
   *
   * @return object
   *        An object with 3 properties: filename, text, and
   *        executionContext.
   */
  getState: function SP_getState() {
    return {
      filename: this.filename,
      text: this.getText(),
      executionContext: this.executionContext,
      saved: !this.dirty,
    };
  },

  /**
   * Set the filename and execution context using the given state. Called
   * when scratchpad is being restored from a previous session.
   *
   * @param object aState
   *        An object with filename and executionContext properties.
   */
  setState: function SP_setState(aState) {
    if (aState.filename) {
      this.setFilename(aState.filename);
    }

    this.dirty = !aState.saved;

    if (aState.executionContext == SCRATCHPAD_CONTEXT_BROWSER) {
      this.setBrowserContext();
    } else {
      this.setContentContext();
    }
  },

  /**
   * Get the most recent main chrome browser window
   */
  get browserWindow() {
    return Services.wm.getMostRecentWindow(gDevTools.chromeWindowType);
  },

  /**
   * Get the gBrowser object of the most recent browser window.
   */
  get gBrowser() {
    const recentWin = this.browserWindow;
    return recentWin ? recentWin.gBrowser : null;
  },

  /**
   * Unique name for the current Scratchpad instance. Used to distinguish
   * Scratchpad windows between each other. See bug 661762.
   */
  get uniqueName() {
    return "Scratchpad/" + this._instanceId;
  },

  /**
   * Sidebar that contains the VariablesView for object inspection.
   */
  get sidebar() {
    if (!this._sidebar) {
      this._sidebar = new ScratchpadSidebar(this);
    }
    return this._sidebar;
  },

  /**
   * Replaces context of an editor with provided value (a string).
   * Note: this method is simply a shortcut to editor.setText.
   */
  setText: function SP_setText(value) {
    return this.editor.setText(value);
  },

  /**
   * Evaluate a string in the currently desired context, that is either the
   * chrome window or the tab content window object.
   *
   * @param string string
   *        The script you want to evaluate.
   * @return Promise
   *         The promise for the script evaluation result.
   */
  async evaluate(string) {
    let connection;
    if (this.target) {
      connection = ScratchpadTarget.consoleFor(this.target);
    } else if (this.executionContext == SCRATCHPAD_CONTEXT_CONTENT) {
      connection = ScratchpadTab.consoleFor(this.gBrowser.selectedTab);
    } else {
      connection = ScratchpadWindow.consoleFor(this.browserWindow);
    }

    const evalOptions = { url: this.uniqueName };
    const { debuggerClient, webConsoleClient } = await connection;
    this.debuggerClient = debuggerClient;
    this.webConsoleClient = webConsoleClient;
    const response = await webConsoleClient.evaluateJSAsync(
      string,
      evalOptions
    );

    if (response.error) {
      throw new Error(response.error);
    } else if (response.exception != null) {
      return [string, response];
    } else {
      return [string, undefined, response.result];
    }
  },

  /**
   * Execute the selected text (if any) or the entire editor content in the
   * current context.
   *
   * @return Promise
   *         The promise for the script evaluation result.
   */
  execute() {
    WebConsoleUtils.usageCount++;
    const selection = this.editor.getSelection() || this.getText();
    return this.evaluate(selection);
  },

  /**
   * Execute the selected text (if any) or the entire editor content in the
   * current context.
   *
   * @return Promise
   *         The promise for the script evaluation result.
   */
  async run() {
    const [string, error, result] = await this.execute();
    if (error) {
      await this.writeAsErrorComment(error);
    } else {
      this.editor.dropSelection();
    }
    return [string, error, result];
  },

  /**
   * Execute the selected text (if any) or the entire editor content in the
   * current context. The resulting object is inspected up in the sidebar.
   *
   * @return Promise
   *         The promise for the script evaluation result.
   */
  async inspect() {
    const [string, error, result] = await this.execute();
    if (error) {
      await this.writeAsErrorComment(error);
    } else {
      this.editor.dropSelection();
      await this.sidebar.open(string, result);
    }
    return [string, error, result];
  },

  /**
   * Reload the current page and execute the entire editor content when
   * the page finishes loading. Note that this operation should be available
   * only in the content context.
   *
   * @return Promise
   *         The promise for the script evaluation result.
   */
  async reloadAndRun() {
    if (this.executionContext !== SCRATCHPAD_CONTEXT_CONTENT) {
      console.error(
        this.strings.GetStringFromName("scratchpadContext.invalid")
      );
      return;
    }

    const target = await TargetFactory.forTab(this.gBrowser.selectedTab);
    await target.attach();
    const onNavigate = target.once("navigate");
    target.reload();
    await onNavigate;
    await this.run();
  },

  /**
   * Execute the selected text (if any) or the entire editor content in the
   * current context. The evaluation result is inserted into the editor after
   * the selected text, or at the end of the editor content if there is no
   * selected text.
   *
   * @return Promise
   *         The promise for the script evaluation result.
   */
  async display() {
    const [string, error, result] = await this.execute();
    if (error) {
      await this.writeAsErrorComment(error);
      return [string, error, result];
    } else if (VariablesView.isPrimitive({ value: result })) {
      await this._writePrimitiveAsComment(result);
      return [string, error, result];
    }
    const objectClient = new ObjectClient(this.debuggerClient, result);
    const response = await objectClient.getDisplayString();
    if (response.error) {
      reportError("display", response);
      throw new Error(response.error);
    } else {
      this.writeAsComment(response.displayString);
      return [string, error, result];
    }
  },

  /**
   * Parse the text and return an AST. If we can't parse it, write an error
   * comment and return false.
   */
  _parseText: function SP__parseText(aText) {
    try {
      return Reflect.parse(aText);
    } catch (e) {
      this.writeAsErrorComment({ exception: DevToolsUtils.safeErrorString(e) });
      return false;
    }
  },

  /**
   * Determine if the given AST node location contains the given cursor
   * position.
   *
   * @returns Boolean
   */
  _containsCursor: function(aLoc, aCursorPos) {
    // Our line numbers are 1-based, while CodeMirror's are 0-based.
    const lineNumber = aCursorPos.line + 1;
    const columnNumber = aCursorPos.ch;

    if (aLoc.start.line <= lineNumber && aLoc.end.line >= lineNumber) {
      if (aLoc.start.line === aLoc.end.line) {
        return (
          aLoc.start.column <= columnNumber && aLoc.end.column >= columnNumber
        );
      }

      if (aLoc.start.line == lineNumber) {
        return columnNumber >= aLoc.start.column;
      }

      if (aLoc.end.line == lineNumber) {
        return columnNumber <= aLoc.end.column;
      }

      return true;
    }

    return false;
  },

  /**
   * Find the top level function AST node that the cursor is within.
   *
   * @returns Object|null
   */
  _findTopLevelFunction: function SP__findTopLevelFunction(aAst, aCursorPos) {
    for (const statement of aAst.body) {
      switch (statement.type) {
        case "FunctionDeclaration":
          if (this._containsCursor(statement.loc, aCursorPos)) {
            return statement;
          }
          break;

        case "VariableDeclaration":
          for (const decl of statement.declarations) {
            if (!decl.init) {
              continue;
            }
            if (
              (decl.init.type == "FunctionExpression" ||
                decl.init.type == "ArrowFunctionExpression") &&
              this._containsCursor(decl.loc, aCursorPos)
            ) {
              return decl;
            }
          }
          break;
      }
    }

    return null;
  },

  /**
   * Get the source text associated with the given function statement.
   *
   * @param Object aFunction
   * @param String aFullText
   * @returns String
   */
  _getFunctionText: function SP__getFunctionText(aFunction, aFullText) {
    let functionText = "";
    // Initially set to 0, but incremented first thing in the loop below because
    // line numbers are 1 based, not 0 based.
    let lineNumber = 0;
    const { start, end } = aFunction.loc;
    const singleLine = start.line === end.line;

    for (const line of aFullText.split(/\n/g)) {
      lineNumber++;

      if (singleLine && start.line === lineNumber) {
        functionText = line.slice(start.column, end.column);
        break;
      }

      if (start.line === lineNumber) {
        functionText += line.slice(start.column) + "\n";
        continue;
      }

      if (end.line === lineNumber) {
        functionText += line.slice(0, end.column);
        break;
      }

      if (start.line < lineNumber && end.line > lineNumber) {
        functionText += line + "\n";
      }
    }

    return functionText;
  },

  /**
   * Evaluate the top level function that the cursor is resting in.
   *
   * @returns Promise [text, error, result]
   */
  evalTopLevelFunction() {
    const text = this.getText();
    const ast = this._parseText(text);
    if (!ast) {
      return Promise.resolve([text, undefined, undefined]);
    }

    const cursorPos = this.editor.getCursor();
    const funcStatement = this._findTopLevelFunction(ast, cursorPos);
    if (!funcStatement) {
      return Promise.resolve([text, undefined, undefined]);
    }

    let functionText = this._getFunctionText(funcStatement, text);

    // TODO: This is a work around for bug 940086. It should be removed when
    // that is fixed.
    if (
      funcStatement.type == "FunctionDeclaration" &&
      !functionText.startsWith("function ")
    ) {
      functionText = "function " + functionText;
      funcStatement.loc.start.column -= 9;
    }

    // The decrement by one is because our line numbers are 1-based, while
    // CodeMirror's are 0-based.
    const from = {
      line: funcStatement.loc.start.line - 1,
      ch: funcStatement.loc.start.column,
    };
    const to = {
      line: funcStatement.loc.end.line - 1,
      ch: funcStatement.loc.end.column,
    };

    const marker = this.editor.markText(from, to, "eval-text");
    setTimeout(() => marker.clear(), EVAL_FUNCTION_TIMEOUT);

    return this.evaluate(functionText);
  },

  /**
   * Writes out a primitive value as a comment. This handles values which are
   * to be printed directly (number, string) as well as grips to values
   * (null, undefined, longString).
   *
   * @param any value
   *        The value to print.
   * @return Promise
   *         The promise that resolves after the value has been printed.
   */
  async _writePrimitiveAsComment(value) {
    if (value.type == "longString") {
      const client = this.webConsoleClient;
      const response = await client
        .longString(value)
        .substring(0, value.length);
      if (response.error) {
        reportError("display", response);
        throw new Error(response.error);
      } else {
        this.writeAsComment(response.substring);
      }
    } else {
      this.writeAsComment(value.type || value);
    }
  },

  /**
   * Write out a value at the next line from the current insertion point.
   * The comment block will always be preceded by a newline character.
   * @param object value
   *        The Object to write out as a string
   */
  writeAsComment(value) {
    const comment = "\n/*\n" + value + "\n*/";

    if (this.editor.somethingSelected()) {
      const from = this.editor.getCursor("end");
      this.editor.replaceSelection(this.editor.getSelection() + comment);
      const to = this.editor.getPosition(
        this.editor.getOffset(from) + comment.length
      );
      this.editor.setSelection(from, to);
      return;
    }

    const text = this.editor.getText();
    this.editor.setText(text + comment);

    const [from, to] = this.editor.getPosition(
      text.length,
      (text + comment).length
    );
    this.editor.setSelection(from, to);
  },

  /**
   * Write out an error at the current insertion point as a block comment
   * @param object error
   *        The error object to write out the message and stack trace. It must
   *        contain an |exception| property with the actual error thrown, but it
   *        will often be the entire response of an evaluateJS request.
   * @return Promise
   *         The promise that indicates when writing the comment completes.
   */
  writeAsErrorComment(error) {
    return new Promise(async (resolve, reject) => {
      const exception = error.exception;
      if (VariablesView.isPrimitive({ value: exception })) {
        const type = exception.type;
        if (
          type == "undefined" ||
          type == "null" ||
          type == "Infinity" ||
          type == "-Infinity" ||
          type == "NaN" ||
          type == "-0"
        ) {
          resolve(type);
        } else if (type == "longString") {
          resolve(exception.initial + "\u2026");
        } else {
          resolve(exception);
        }
      } else if ("preview" in exception) {
        const stack = this._constructErrorStack(exception.preview);
        if (typeof error.exceptionMessage == "string") {
          resolve(error.exceptionMessage + stack);
        } else {
          resolve(stack);
        }
      } else {
        // If there is no preview information, we need to ask the server for more.
        const objectClient = new ObjectClient(this.debuggerClient, exception);
        const response = await objectClient.getPrototypeAndProperties();
        if (response.error) {
          reject(response);
          return;
        }

        const { ownProperties, safeGetterValues } = response;
        const error = Object.create(null);

        // Combine all the property descriptor/getter values into one object.
        for (const key of Object.keys(safeGetterValues)) {
          error[key] = safeGetterValues[key].getterValue;
        }

        for (const key of Object.keys(ownProperties)) {
          error[key] = ownProperties[key].value;
        }

        const stack = this._constructErrorStack(error);

        if (typeof error.message == "string") {
          resolve(error.message + stack);
        } else {
          const response = await objectClient.getDisplayString();
          if (response.error) {
            reject(response);
          } else if (typeof response.displayString == "string") {
            resolve(response.displayString + stack);
          } else {
            resolve(stack);
          }
        }
      }
    }).then(message => {
      console.error(message);
      this.writeAsComment("Exception: " + message);
    });
  },

  /**
   * Assembles the best possible stack from the properties of the provided
   * error.
   */
  _constructErrorStack(error) {
    let stack;
    if (typeof error.stack == "string" && error.stack) {
      stack = error.stack;
    } else if (typeof error.fileName == "string") {
      stack = "@" + error.fileName;
      if (typeof error.lineNumber == "number") {
        stack += ":" + error.lineNumber;
      }
    } else if (typeof error.filename == "string") {
      stack = "@" + error.filename;
      if (typeof error.lineNumber == "number") {
        stack += ":" + error.lineNumber;
        if (typeof error.columnNumber == "number") {
          stack += ":" + error.columnNumber;
        }
      }
    } else if (typeof error.lineNumber == "number") {
      stack = "@" + error.lineNumber;
      if (typeof error.columnNumber == "number") {
        stack += ":" + error.columnNumber;
      }
    }

    return stack ? "\n" + stack.replace(/\n$/, "") : "";
  },

  // Menu Operations

  /**
   * Open a new Scratchpad window.
   *
   * @return nsIWindow
   */
  openScratchpad: function SP_openScratchpad() {
    return ScratchpadManager.openScratchpad();
  },

  /**
   * Export the textbox content to a file.
   *
   * @param nsIFile file
   *        The file where you want to save the textbox content.
   * @param boolean noConfirmation
   *        If the file already exists, ask for confirmation?
   * @param boolean silentError
   *        True if you do not want to display an error when file save fails,
   *        false otherwise.
   * @param function callback
   *        Optional function you want to call when file save completes. It will
   *        get the following arguments:
   *        1) the nsresult status code for the export operation.
   */
  async exportToFile(file, noConfirmation, silentError, callback) {
    if (
      !noConfirmation &&
      file.exists() &&
      !window.confirm(
        this.strings.GetStringFromName("export.fileOverwriteConfirmation")
      )
    ) {
      return;
    }

    const encoder = new TextEncoder();
    const buffer = encoder.encode(this.getText());
    try {
      await OS.File.writeAtomic(file.path, buffer, {
        tmpPath: file.path + ".tmp",
      });
      if (callback) {
        callback.call(this, Cr.NS_OK);
      }
    } catch (error) {
      if (!silentError) {
        window.alert(this.strings.GetStringFromName("saveFile.failed"));
      }
      if (callback) {
        callback.call(this, Cr.NS_ERROR_UNEXPECTED);
      }
    }
  },

  /**
   * Get a list of applicable charsets.
   * The best charset, defaulting to "UTF-8"
   *
   * @param string aBestCharset
   * @return array of strings
   */
  _getApplicableCharsets: function SP__getApplicableCharsets(
    aBestCharset = "UTF-8"
  ) {
    const charsets = Services.prefs
      .getCharPref(FALLBACK_CHARSET_LIST)
      .split(",")
      .filter(function(value) {
        return value.length;
      });
    charsets.unshift(aBestCharset);
    return charsets;
  },

  /**
   * Get content converted to unicode, using a list of input charset to try.
   *
   * @param string aContent
   * @param array of string aCharsetArray
   * @return string
   */
  _getUnicodeContent: function SP__getUnicodeContent(aContent, aCharsetArray) {
    const converter = Cc[
      "@mozilla.org/intl/scriptableunicodeconverter"
    ].createInstance(Ci.nsIScriptableUnicodeConverter);

    let content = null;
    aCharsetArray.some(charset => {
      try {
        converter.charset = charset;
        content = converter.ConvertToUnicode(aContent);
        return true;
      } catch (e) {
        this.notificationBox.appendNotification(
          this.strings.formatStringFromName("importFromFile.convert.failed", [
            charset,
          ]),
          "file-import-convert-failed",
          null,
          this.notificationBox.PRIORITY_WARNING_HIGH,
          null
        );
      }
    });
    return content;
  },

  /**
   * Read the content of a file and put it into the textbox.
   *
   * @param nsIFile aFile
   *        The file you want to save the textbox content into.
   * @param boolean aSilentError
   *        True if you do not want to display an error when file load fails,
   *        false otherwise.
   * @param function aCallback
   *        Optional function you want to call when file load completes. It will
   *        get the following arguments:
   *        1) the nsresult status code for the import operation.
   *        2) the data that was read from the file, if any.
   * @return Promise resolved with array of callback args
   */
  importFromFile: function SP_importFromFile(aFile, aSilentError, aCallback) {
    return new Promise(resolve => {
      // Prevent file type detection.
      const channel = NetUtil.newChannel({
        uri: NetUtil.newURI(aFile),
        loadingNode: window.document,
        securityFlags: Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_DATA_INHERITS,
        contentPolicyType: Ci.nsIContentPolicy.TYPE_OTHER,
      });
      channel.contentType = "application/javascript";

      this.notificationBox.removeAllNotifications(false);

      NetUtil.asyncFetch(channel, (aInputStream, aStatus) => {
        let content = null;

        if (Components.isSuccessCode(aStatus)) {
          const charsets = this._getApplicableCharsets();
          content = NetUtil.readInputStreamToString(
            aInputStream,
            aInputStream.available()
          );
          content = this._getUnicodeContent(content, charsets);
          if (!content) {
            const message = this.strings.formatStringFromName(
              "importFromFile.convert.failed",
              [charsets.join(", ")]
            );
            this.notificationBox.appendNotification(
              message,
              "file-import-convert-failed",
              null,
              this.notificationBox.PRIORITY_CRITICAL_MEDIUM,
              null
            );
            if (aCallback) {
              aCallback.call(this, aStatus, content);
            }
            resolve([aStatus, content]);
            return;
          }
          // Check to see if the first line is a mode-line comment.
          const line = content.split("\n")[0];
          const modeline = this._scanModeLine(line);
          const chrome = Services.prefs.getBoolPref(DEVTOOLS_CHROME_ENABLED);

          if (chrome && modeline["-sp-context"] === "browser") {
            this.setBrowserContext();
          }

          this.editor.setText(content);
          this.editor.clearHistory();
          this.dirty = false;
          document
            .getElementById("sp-cmd-revert")
            .setAttribute("disabled", true);
        } else if (!aSilentError) {
          window.alert(this.strings.GetStringFromName("openFile.failed"));
        }
        this.setFilename(aFile.path);
        this.setRecentFile(aFile);
        if (aCallback) {
          aCallback.call(this, aStatus, content);
        }
        resolve([aStatus, content]);
      });
    });
  },

  /**
   * Open a file to edit in the Scratchpad.
   *
   * @param integer aIndex
   *        Optional integer: clicked menuitem in the 'Open Recent'-menu.
   *        If omitted, prompt the user to pick a file to open.
   *
   * @return Promise
   *        A Promise that resolves to undefined when the file is opened (or
   *        can't be opened), or when the user cancels the file picker dialog.
   *        This method effectively catches all errors and reports them to the
   *        notificationBox, so the promise never becomes rejected.
   */
  openFile(aIndex) {
    return new Promise(resolve => {
      const promptCallback = aFile => {
        this.promptSave((aCloseFile, aSaved, aStatus) => {
          let shouldOpen = aCloseFile;
          if (aSaved && !Components.isSuccessCode(aStatus)) {
            shouldOpen = false;
          }

          if (!shouldOpen) {
            resolve();
            return;
          }

          let file;
          if (aFile) {
            file = aFile;
          } else {
            file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            const filePath = this.getRecentFiles()[aIndex];
            file.initWithPath(filePath);
          }

          if (!file.exists()) {
            this.notificationBox.appendNotification(
              this.strings.GetStringFromName("fileNoLongerExists.notification"),
              "file-no-longer-exists",
              null,
              this.notificationBox.PRIORITY_WARNING_HIGH,
              null
            );

            this.clearFiles(aIndex, 1);
            resolve();
            return;
          }

          this.importFromFile(file, false).finally(_ => resolve());
        });
      };

      if (aIndex > -1) {
        promptCallback();
      } else {
        const fp = Cc["@mozilla.org/filepicker;1"].createInstance(
          Ci.nsIFilePicker
        );
        fp.init(
          window,
          this.strings.GetStringFromName("openFile.title"),
          Ci.nsIFilePicker.modeOpen
        );
        fp.defaultString = "";
        fp.appendFilter("JavaScript Files", "*.js; *.jsm; *.json");
        fp.appendFilter("All Files", "*.*");
        fp.open(aResult => {
          if (aResult == Ci.nsIFilePicker.returnCancel) {
            resolve();
          } else {
            promptCallback(fp.file);
          }
        });
      }
    });
  },

  /**
   * Get recent files.
   *
   * @return Array
   *         File paths.
   */
  getRecentFiles: function SP_getRecentFiles() {
    const branch = Services.prefs.getBranch("devtools.scratchpad.");
    let filePaths = [];

    // WARNING: Do not use getCharPref here, it doesn't play nicely with
    // Unicode strings.

    if (branch.prefHasUserValue("recentFilePaths")) {
      const data = branch.getStringPref("recentFilePaths");
      filePaths = JSON.parse(data);
    }

    return filePaths;
  },

  /**
   * Save a recent file in a JSON parsable string.
   *
   * @param nsIFile aFile
   *        The nsIFile we want to save as a recent file.
   */
  setRecentFile: function SP_setRecentFile(aFile) {
    const maxRecent = Services.prefs.getIntPref(PREF_RECENT_FILES_MAX);
    if (maxRecent < 1) {
      return;
    }

    const filePaths = this.getRecentFiles();
    const filesCount = filePaths.length;
    const pathIndex = filePaths.indexOf(aFile.path);

    // We are already storing this file in the list of recent files.
    if (pathIndex > -1) {
      // If it's already the most recent file, we don't have to do anything.
      if (pathIndex === filesCount - 1) {
        // Updating the menu to clear the disabled state from the wrong menuitem
        // in rare cases when two or more Scratchpad windows are open and the
        // same file has been opened in two or more windows.
        this.populateRecentFilesMenu();
        return;
      }

      // It is not the most recent file. Remove it from the list, we add it as
      // the most recent farther down.
      filePaths.splice(pathIndex, 1);
    } else if (filesCount === maxRecent) {
      // If we are not storing the file and the 'recent files'-list is full,
      // remove the oldest file from the list.
      filePaths.shift();
    }

    filePaths.push(aFile.path);

    Services.prefs
      .getBranch("devtools.scratchpad.")
      .setStringPref("recentFilePaths", JSON.stringify(filePaths));
  },

  /**
   * Populates the 'Open Recent'-menu.
   */
  populateRecentFilesMenu: function SP_populateRecentFilesMenu() {
    const maxRecent = Services.prefs.getIntPref(PREF_RECENT_FILES_MAX);
    const recentFilesMenu = document.getElementById("sp-open_recent-menu");

    if (maxRecent < 1) {
      recentFilesMenu.setAttribute("hidden", true);
      return;
    }

    const recentFilesPopup = recentFilesMenu.menupopup;
    const filePaths = this.getRecentFiles();
    const filename = this.getState().filename;

    recentFilesMenu.setAttribute("disabled", true);
    while (recentFilesPopup.hasChildNodes()) {
      recentFilesPopup.firstChild.remove();
    }

    if (filePaths.length > 0) {
      recentFilesMenu.removeAttribute("disabled");

      // Print out menuitems with the most recent file first.
      for (let i = filePaths.length - 1; i >= 0; --i) {
        const menuitem = document.createXULElement("menuitem");
        menuitem.setAttribute("type", "radio");
        menuitem.setAttribute("label", filePaths[i]);

        if (filePaths[i] === filename) {
          menuitem.setAttribute("checked", true);
          menuitem.setAttribute("disabled", true);
        }

        menuitem.addEventListener(
          "command",
          Scratchpad.openFile.bind(Scratchpad, i)
        );
        recentFilesPopup.appendChild(menuitem);
      }

      recentFilesPopup.appendChild(document.createXULElement("menuseparator"));
      const clearItems = document.createXULElement("menuitem");
      clearItems.setAttribute("id", "sp-menu-clear_recent");
      clearItems.setAttribute(
        "label",
        this.strings.GetStringFromName("clearRecentMenuItems.label")
      );
      clearItems.setAttribute("command", "sp-cmd-clearRecentFiles");
      recentFilesPopup.appendChild(clearItems);
    }
  },

  /**
   * Clear a range of files from the list.
   *
   * @param integer aIndex
   *        Index of file in menu to remove.
   * @param integer aLength
   *        Number of files from the index 'aIndex' to remove.
   */
  clearFiles: function SP_clearFile(aIndex, aLength) {
    const filePaths = this.getRecentFiles();
    filePaths.splice(aIndex, aLength);

    Services.prefs
      .getBranch("devtools.scratchpad.")
      .setStringPref("recentFilePaths", JSON.stringify(filePaths));
  },

  /**
   * Clear all recent files.
   */
  clearRecentFiles: function SP_clearRecentFiles() {
    Services.prefs.clearUserPref("devtools.scratchpad.recentFilePaths");
  },

  /**
   * Handle changes to the 'PREF_RECENT_FILES_MAX'-preference.
   */
  handleRecentFileMaxChange: function SP_handleRecentFileMaxChange() {
    const maxRecent = Services.prefs.getIntPref(PREF_RECENT_FILES_MAX);
    const menu = document.getElementById("sp-open_recent-menu");

    // Hide the menu if the 'PREF_RECENT_FILES_MAX'-pref is set to zero or less.
    if (maxRecent < 1) {
      menu.setAttribute("hidden", true);
    } else {
      if (menu.hasAttribute("hidden")) {
        if (!menu.menupopup.hasChildNodes()) {
          this.populateRecentFilesMenu();
        }

        menu.removeAttribute("hidden");
      }

      const filePaths = this.getRecentFiles();
      if (maxRecent < filePaths.length) {
        const diff = filePaths.length - maxRecent;
        this.clearFiles(0, diff);
      }
    }
  },
  /**
   * Save the textbox content to the currently open file.
   *
   * @param function aCallback
   *        Optional function you want to call when file is saved
   * @return Promise
   */
  saveFile: function SP_saveFile(aCallback) {
    if (!this.filename) {
      return this.saveFileAs(aCallback);
    }

    return new Promise(resolve => {
      const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      file.initWithPath(this.filename);

      this.exportToFile(file, true, false, aStatus => {
        if (Components.isSuccessCode(aStatus)) {
          this.dirty = false;
          document
            .getElementById("sp-cmd-revert")
            .setAttribute("disabled", true);
          this.setRecentFile(file);
        }
        if (aCallback) {
          aCallback(aStatus);
        }
        resolve(aStatus);
      });
    });
  },

  /**
   * Save the textbox content to a new file.
   *
   * @param function callback
   *        Optional function you want to call when file is saved
   * @return Promise
   */
  saveFileAs(callback) {
    return new Promise(resolve => {
      const fp = Cc["@mozilla.org/filepicker;1"].createInstance(
        Ci.nsIFilePicker
      );
      const fpCallback = result => {
        if (result != Ci.nsIFilePicker.returnCancel) {
          this.setFilename(fp.file.path);
          this.exportToFile(fp.file, true, false, status => {
            if (Components.isSuccessCode(status)) {
              this.dirty = false;
              this.setRecentFile(fp.file);
            }
            if (callback) {
              callback(status);
            }
            resolve(status);
          });
        }
      };

      fp.init(
        window,
        this.strings.GetStringFromName("saveFileAs"),
        Ci.nsIFilePicker.modeSave
      );
      fp.defaultString = "scratchpad.js";
      fp.appendFilter("JavaScript Files", "*.js; *.jsm; *.json");
      fp.appendFilter("All Files", "*.*");
      fp.open(fpCallback);
    });
  },

  /**
   * Restore content from saved version of current file.
   *
   * @param function aCallback
   *        Optional function you want to call when file is saved
   */
  revertFile: function SP_revertFile(aCallback) {
    const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    file.initWithPath(this.filename);

    if (!file.exists()) {
      return;
    }

    this.importFromFile(file, false, (aStatus, aContent) => {
      if (aCallback) {
        aCallback(aStatus);
      }
    });
  },

  /**
   * Prompt to revert scratchpad if it has unsaved changes.
   *
   * @param function aCallback
   *        Optional function you want to call when file is saved. The callback
   *        receives three arguments:
   *          - aRevert (boolean) - tells if the file has been reverted.
   *          - status (number) - the file revert status result (if the file was
   *          saved).
   */
  promptRevert: function SP_promptRervert(aCallback) {
    if (this.filename) {
      const ps = Services.prompt;
      const flags =
        ps.BUTTON_POS_0 * ps.BUTTON_TITLE_REVERT +
        ps.BUTTON_POS_1 * ps.BUTTON_TITLE_CANCEL;

      const button = ps.confirmEx(
        window,
        this.strings.GetStringFromName("confirmRevert.title"),
        this.strings.GetStringFromName("confirmRevert"),
        flags,
        null,
        null,
        null,
        null,
        {}
      );
      if (button == BUTTON_POSITION_CANCEL) {
        if (aCallback) {
          aCallback(false);
        }

        return;
      }
      if (button == BUTTON_POSITION_REVERT) {
        this.revertFile(aStatus => {
          if (aCallback) {
            aCallback(true, aStatus);
          }
        });

        return;
      }
    }
    if (aCallback) {
      aCallback(false);
    }
  },

  /**
   * Open the Error Console.
   */
  openErrorConsole: function SP_openErrorConsole() {
    BrowserConsoleManager.toggleBrowserConsole();
  },

  /**
   * Open the Web Console.
   */
  openWebConsole: async function SP_openWebConsole() {
    const target = await TargetFactory.forTab(this.gBrowser.selectedTab);
    gDevTools.showToolbox(target, "webconsole");
    this.browserWindow.focus();
  },

  /**
   * Set the current execution context to be the active tab content window.
   */
  setContentContext: function SP_setContentContext() {
    if (this.executionContext == SCRATCHPAD_CONTEXT_CONTENT) {
      return;
    }

    const content = document.getElementById("sp-menu-content");
    document.getElementById("sp-menu-browser").removeAttribute("checked");
    document.getElementById("sp-cmd-reloadAndRun").removeAttribute("disabled");
    content.setAttribute("checked", true);
    this.executionContext = SCRATCHPAD_CONTEXT_CONTENT;
    this.notificationBox.removeAllNotifications(false);
  },

  /**
   * Set the current execution context to be the most recent chrome window.
   */
  setBrowserContext: function SP_setBrowserContext() {
    if (this.executionContext == SCRATCHPAD_CONTEXT_BROWSER) {
      return;
    }

    const browser = document.getElementById("sp-menu-browser");
    const reloadAndRun = document.getElementById("sp-cmd-reloadAndRun");

    document.getElementById("sp-menu-content").removeAttribute("checked");
    reloadAndRun.setAttribute("disabled", true);
    browser.setAttribute("checked", true);

    this.executionContext = SCRATCHPAD_CONTEXT_BROWSER;
    this.notificationBox.appendNotification(
      this.strings.GetStringFromName("browserContext.notification"),
      SCRATCHPAD_CONTEXT_BROWSER,
      null,
      this.notificationBox.PRIORITY_WARNING_HIGH,
      null
    );
  },

  /**
   * Gets the ID of the inner window of the given DOM window object.
   *
   * @param nsIDOMWindow aWindow
   * @return integer
   *         the inner window ID
   */
  getInnerWindowId: function SP_getInnerWindowId(aWindow) {
    return aWindow.windowUtils.currentInnerWindowID;
  },

  updateStatusBar: function SP_updateStatusBar(aEventType) {
    var statusBarField = document.getElementById("statusbar-line-col");
    const { line, ch } = this.editor.getCursor();
    statusBarField.textContent = this.strings.formatStringFromName(
      "scratchpad.statusBarLineCol",
      [line + 1, ch + 1]
    );
  },

  /**
   * The Scratchpad window load event handler. This method
   * initializes the Scratchpad window and source editor.
   *
   * @param Event aEvent
   */
  onLoad: function SP_onLoad(aEvent) {
    if (aEvent.target != document) {
      return;
    }

    this.notificationBox = new window.MozElements.NotificationBox(element => {
      document.getElementById("scratchpad-container").prepend(element);
    });

    const chrome = Services.prefs.getBoolPref(DEVTOOLS_CHROME_ENABLED);
    if (chrome) {
      const environmentMenu = document.getElementById("sp-environment-menu");
      const errorConsoleCommand = document.getElementById(
        "sp-cmd-errorConsole"
      );
      const chromeContextCommand = document.getElementById(
        "sp-cmd-browserContext"
      );
      environmentMenu.removeAttribute("hidden");
      chromeContextCommand.removeAttribute("disabled");
      errorConsoleCommand.removeAttribute("disabled");
    }

    let initialText = this.strings.formatStringFromName("scratchpadIntro1", [
      ShortcutUtils.prettifyShortcut(
        document.getElementById("sp-key-run"),
        true
      ),
      ShortcutUtils.prettifyShortcut(
        document.getElementById("sp-key-inspect"),
        true
      ),
      ShortcutUtils.prettifyShortcut(
        document.getElementById("sp-key-display"),
        true
      ),
    ]);

    let args = window.arguments;
    let state = null;

    if (args && args[0] instanceof Ci.nsIDialogParamBlock) {
      args = args[0];
      this._instanceId = args.GetString(0);

      state = args.GetString(1) || null;
      if (state) {
        state = JSON.parse(state);
        this.setState(state);
        if ("text" in state) {
          initialText = state.text;
        }
      }
    } else {
      this._instanceId = ScratchpadManager.createUid();
    }

    const config = {
      mode: Editor.modes.js,
      value: initialText,
      lineNumbers: Services.prefs.getBoolPref(SHOW_LINE_NUMBERS),
      contextMenu: "scratchpad-text-popup",
      showTrailingSpace: Services.prefs.getBoolPref(SHOW_TRAILING_SPACE),
      autocomplete: Services.prefs.getBoolPref(ENABLE_AUTOCOMPLETION),
      lineWrapping: Services.prefs.getBoolPref(WRAP_TEXT),
    };

    this.editor = new Editor(config);
    const editorElement = document.querySelector("#scratchpad-editor");
    this.editor
      .appendTo(editorElement)
      .then(() => {
        var lines = initialText.split("\n");

        this.editor.setFontSize(Services.prefs.getIntPref(EDITOR_FONT_SIZE));

        // Display the deprecation warning for Scratchpad.
        const deprecationWarning = document.createElement("a");
        deprecationWarning.setAttribute(
          "href",
          "https://developer.mozilla.org/docs/Tools/Deprecated_tools#Scratchpad"
        );
        deprecationWarning.setAttribute("target", "_blank");
        deprecationWarning.append(
          this.strings.GetStringFromName("scratchpad.deprecated.label")
        );

        const deprecationFragment = document.createDocumentFragment();
        deprecationFragment.append(deprecationWarning);

        this.notificationBox.appendNotification(
          deprecationFragment,
          "scratchpad.deprecated",
          null,
          this.notificationBox.PRIORITY_WARNING_HIGH
        );

        this.editor.on("change", this._onChanged);
        // Keep a reference to the bound version for use in onUnload.
        this.updateStatusBar = Scratchpad.updateStatusBar.bind(this);
        this.editor.on("cursorActivity", this.updateStatusBar);
        const okstring = this.strings.GetStringFromName("selfxss.okstring");
        const msg = this.strings.formatStringFromName("selfxss.msg", [
          okstring,
        ]);
        this._onPaste = pasteHandlerGen(
          this.editor.container.contentDocument.body,
          this.notificationBox,
          msg,
          okstring
        );

        editorElement.addEventListener("paste", this._onPaste, true);
        editorElement.addEventListener("drop", this._onPaste);
        this.editor.on("saveRequested", () => this.saveFile());
        this.editor.focus();
        this.editor.setCursor({ line: lines.length, ch: lines.pop().length });

        // Add the commands controller for the source-editor.
        this.editor.insertCommandsController();

        if (state) {
          this.dirty = !state.saved;
        }

        this.initialized = true;
        this._triggerObservers("Ready");
        this.populateRecentFilesMenu();
        PreferenceObserver.init();
        CloseObserver.init();
      })
      .catch(console.error);
    this._setupCommandListeners();
    this._updateViewMenuItems();
    this._setupPopupShowingListeners();

    // Change the accesskey for the help menu as it can be specific on Windows
    // some localizations of Windows (ex:french, german) use "?"
    //  for the help button in the menubar but Gnome does not.
    if (Services.appinfo.OS == "WINNT") {
      const helpMenu = document.getElementById("sp-help-menu");
      helpMenu.setAttribute(
        "accesskey",
        helpMenu.getAttribute("accesskeywindows")
      );
    }
  },

  /**
   * The Source Editor "change" event handler. This function updates the
   * Scratchpad window title to show an asterisk when there are unsaved changes.
   *
   * @private
   */
  _onChanged: function SP__onChanged() {
    Scratchpad._updateTitle();

    if (Scratchpad.filename) {
      if (Scratchpad.dirty) {
        document.getElementById("sp-cmd-revert").removeAttribute("disabled");
      } else {
        document.getElementById("sp-cmd-revert").setAttribute("disabled", true);
      }
    }
  },

  /**
   * Undo the last action of the user.
   */
  undo: function SP_undo() {
    this.editor.undo();
  },

  /**
   * Redo the previously undone action.
   */
  redo: function SP_redo() {
    this.editor.redo();
  },

  /**
   * The Scratchpad window unload event handler. This method unloads/destroys
   * the source editor.
   *
   * @param Event aEvent
   */
  onUnload: function SP_onUnload(aEvent) {
    if (aEvent.target != document) {
      return;
    }

    // This event is created only after user uses 'reload and run' feature.
    if (this._reloadAndRunEvent && this.gBrowser) {
      this.gBrowser.selectedBrowser.removeEventListener(
        "load",
        this._reloadAndRunEvent,
        true
      );
    }

    PreferenceObserver.uninit();
    CloseObserver.uninit();
    if (this._onPaste) {
      const editorElement = document.querySelector("#scratchpad-editor");
      editorElement.removeEventListener("paste", this._onPaste, true);
      editorElement.removeEventListener("drop", this._onPaste);
      this._onPaste = null;
    }
    this.editor.off("change", this._onChanged);
    this.editor.off("cursorActivity", this.updateStatusBar);
    this.editor.destroy();
    this.editor = null;

    if (this._sidebar) {
      this._sidebar.destroy();
      this._sidebar = null;
    }

    scratchpadTargets = null;
    this.webConsoleClient = null;
    this.debuggerClient = null;
    this.initialized = false;
  },

  /**
   * Prompt to save scratchpad if it has unsaved changes.
   *
   * @param function aCallback
   *        Optional function you want to call when file is saved. The callback
   *        receives three arguments:
   *          - toClose (boolean) - tells if the window should be closed.
   *          - saved (boolen) - tells if the file has been saved.
   *          - status (number) - the file save status result (if the file was
   *          saved).
   * @return boolean
   *         Whether the window should be closed
   */
  promptSave: function SP_promptSave(aCallback) {
    if (this.dirty) {
      const ps = Services.prompt;
      const flags =
        ps.BUTTON_POS_0 * ps.BUTTON_TITLE_SAVE +
        ps.BUTTON_POS_1 * ps.BUTTON_TITLE_CANCEL +
        ps.BUTTON_POS_2 * ps.BUTTON_TITLE_DONT_SAVE;

      const button = ps.confirmEx(
        window,
        this.strings.GetStringFromName("confirmClose.title"),
        this.strings.GetStringFromName("confirmClose"),
        flags,
        null,
        null,
        null,
        null,
        {}
      );

      if (button == BUTTON_POSITION_CANCEL) {
        if (aCallback) {
          aCallback(false, false);
        }
        return false;
      }

      if (button == BUTTON_POSITION_SAVE) {
        this.saveFile(aStatus => {
          if (aCallback) {
            aCallback(true, true, aStatus);
          }
        });
        return true;
      }
    }

    if (aCallback) {
      aCallback(true, false);
    }
    return true;
  },

  /**
   * Handler for window close event. Prompts to save scratchpad if
   * there are unsaved changes.
   *
   * @param Event aEvent
   * @param function aCallback
   *        Optional function you want to call when file is saved/closed.
   *        Used mainly for tests.
   */
  onClose: function SP_onClose(aEvent, aCallback) {
    aEvent.preventDefault();
    this.close(aCallback);
  },

  /**
   * Close the scratchpad window. Prompts before closing if the scratchpad
   * has unsaved changes.
   *
   * @param function aCallback
   *        Optional function you want to call when file is saved
   */
  close: function SP_close(aCallback) {
    let shouldClose;

    this.promptSave((aShouldClose, aSaved, aStatus) => {
      shouldClose = aShouldClose;
      if (aSaved && !Components.isSuccessCode(aStatus)) {
        shouldClose = false;
      }

      if (shouldClose) {
        window.close();
      }

      if (aCallback) {
        aCallback(shouldClose);
      }
    });

    return shouldClose;
  },

  /**
   * Toggle a editor's boolean option.
   */
  toggleEditorOption: function SP_toggleEditorOption(
    optionName,
    optionPreference
  ) {
    const newOptionValue = !this.editor.getOption(optionName);
    this.editor.setOption(optionName, newOptionValue);
    Services.prefs.setBoolPref(optionPreference, newOptionValue);
  },

  /**
   * Increase the editor's font size by 1 px.
   */
  increaseFontSize: function SP_increaseFontSize() {
    const size = this.editor.getFontSize();

    if (size < MAXIMUM_FONT_SIZE) {
      const newFontSize = size + 1;
      this.editor.setFontSize(newFontSize);
      Services.prefs.setIntPref(EDITOR_FONT_SIZE, newFontSize);

      if (newFontSize === MAXIMUM_FONT_SIZE) {
        document
          .getElementById("sp-cmd-larger-font")
          .setAttribute("disabled", true);
      }

      document
        .getElementById("sp-cmd-smaller-font")
        .removeAttribute("disabled");
    }
  },

  /**
   * Decrease the editor's font size by 1 px.
   */
  decreaseFontSize: function SP_decreaseFontSize() {
    const size = this.editor.getFontSize();

    if (size > MINIMUM_FONT_SIZE) {
      const newFontSize = size - 1;
      this.editor.setFontSize(newFontSize);
      Services.prefs.setIntPref(EDITOR_FONT_SIZE, newFontSize);

      if (newFontSize === MINIMUM_FONT_SIZE) {
        document
          .getElementById("sp-cmd-smaller-font")
          .setAttribute("disabled", true);
      }
    }

    document.getElementById("sp-cmd-larger-font").removeAttribute("disabled");
  },

  /**
   * Restore the editor's original font size.
   */
  normalFontSize: function SP_normalFontSize() {
    this.editor.setFontSize(NORMAL_FONT_SIZE);
    Services.prefs.setIntPref(EDITOR_FONT_SIZE, NORMAL_FONT_SIZE);

    document.getElementById("sp-cmd-larger-font").removeAttribute("disabled");
    document.getElementById("sp-cmd-smaller-font").removeAttribute("disabled");
  },

  _observers: [],

  /**
   * Add an observer for Scratchpad events.
   *
   * The observer implements IScratchpadObserver := {
   *   onReady:      Called when the Scratchpad and its Editor are ready.
   *                 Arguments: (Scratchpad aScratchpad)
   * }
   *
   * All observer handlers are optional.
   *
   * @param IScratchpadObserver aObserver
   * @see removeObserver
   */
  addObserver: function SP_addObserver(aObserver) {
    this._observers.push(aObserver);
  },

  /**
   * Remove an observer for Scratchpad events.
   *
   * @param IScratchpadObserver aObserver
   * @see addObserver
   */
  removeObserver: function SP_removeObserver(aObserver) {
    const index = this._observers.indexOf(aObserver);
    if (index != -1) {
      this._observers.splice(index, 1);
    }
  },

  /**
   * Trigger named handlers in Scratchpad observers.
   *
   * @param string aName
   *        Name of the handler to trigger.
   * @param Array aArgs
   *        Optional array of arguments to pass to the observer(s).
   * @see addObserver
   */
  _triggerObservers: function SP_triggerObservers(aName, aArgs) {
    // insert this Scratchpad instance as the first argument
    if (!aArgs) {
      aArgs = [this];
    } else {
      aArgs.unshift(this);
    }

    // trigger all observers that implement this named handler
    for (let i = 0; i < this._observers.length; ++i) {
      const observer = this._observers[i];
      const handler = observer["on" + aName];
      if (handler) {
        handler.apply(observer, aArgs);
      }
    }
  },

  /**
   * Opens the MDN documentation page for Scratchpad.
   */
  openDocumentationPage: function SP_openDocumentationPage() {
    openDocLink(this.strings.GetStringFromName("help.openDocumentationPage"));
    this.browserWindow.focus();
  },
};

/**
 * Represents the DebuggerClient connection to a specific tab as used by the
 * Scratchpad.
 *
 * @param object aTab
 *              The tab to connect to.
 */
function ScratchpadTab(aTab) {
  this._tab = aTab;
}

var scratchpadTargets = new WeakMap();

/**
 * Returns the object containing the DebuggerClient and WebConsoleClient for a
 * given tab or window.
 *
 * @param object aSubject
 *        The tab or window to obtain the connection for.
 * @return Promise
 *         The promise for the connection information.
 */
ScratchpadTab.consoleFor = function consoleFor(aSubject) {
  if (!scratchpadTargets.has(aSubject)) {
    scratchpadTargets.set(aSubject, new this(aSubject));
  }
  return scratchpadTargets.get(aSubject).connect(aSubject);
};

ScratchpadTab.prototype = {
  /**
   * The promise for the connection.
   */
  _connector: null,

  /**
   * Initialize a debugger client and connect it to the debugger server.
   *
   * @param object subject
   *        The tab or window to obtain the connection for.
   * @return Promise
   *         The promise for the result of connecting to this tab or window.
   */
  connect(subject) {
    if (this._connector) {
      return this._connector;
    }

    this._connector = new Promise(async (resolve, reject) => {
      const connectTimer = setTimeout(() => {
        reject({
          error: "timeout",
          message: Scratchpad.strings.GetStringFromName("connectionTimeout"),
        });
      }, REMOTE_TIMEOUT);
      try {
        const target = await this._attach(subject);
        clearTimeout(connectTimer);
        resolve({
          webConsoleClient: target.activeConsole,
          debuggerClient: target.client,
        });
      } catch (error) {
        reportError("attachConsole", error);
        reject(error);
      }
    });

    return this._connector;
  },

  /**
   * Attach to this tab.
   *
   * @param object subject
   *        The tab or window to obtain the connection for.
   * @return Promise
   *         The promise for the Target for this tab.
   */
  async _attach(subject) {
    const target = await TargetFactory.forTab(this._tab);
    target.once("close", () => {
      if (scratchpadTargets) {
        scratchpadTargets.delete(subject);
      }
    });
    return target.attach().then(() => target);
  },
};

/**
 * Represents the DebuggerClient connection to a specific window as used by the
 * Scratchpad.
 */
function ScratchpadWindow() {}

ScratchpadWindow.consoleFor = ScratchpadTab.consoleFor;

ScratchpadWindow.prototype = extend(ScratchpadTab.prototype, {
  /**
   * Attach to this window.
   *
   * @return Promise
   *         The promise for the target for this window.
   */
  async _attach() {
    DebuggerServer.init();
    DebuggerServer.registerAllActors();
    DebuggerServer.allowChromeProcess = true;

    const client = new DebuggerClient(DebuggerServer.connectPipe());
    await client.connect();
    const target = await client.mainRoot.getMainProcess();
    await target.attach();
    return target;
  },
});

function ScratchpadTarget(aTarget) {
  this._target = aTarget;
}

ScratchpadTarget.consoleFor = ScratchpadTab.consoleFor;

ScratchpadTarget.prototype = extend(ScratchpadTab.prototype, {
  _attach() {
    // We return a promise here to match the typing of ScratchpadWindow._attach.
    return Promise.resolve(this._target);
  },
});

/**
 * Encapsulates management of the sidebar containing the VariablesView for
 * object inspection.
 */
function ScratchpadSidebar(aScratchpad) {
  // Make sure to decorate this object. ToolSidebar requires the parent
  // panel to support event (emit) API.
  EventEmitter.decorate(this);

  const ToolSidebar = require("devtools/client/framework/sidebar").ToolSidebar;
  const tabbox = document.querySelector("#scratchpad-sidebar");
  this._sidebar = new ToolSidebar(tabbox, this, "scratchpad");
  this._scratchpad = aScratchpad;
}

ScratchpadSidebar.prototype = {
  /*
   * The ToolSidebar for this sidebar.
   */
  _sidebar: null,

  /*
   * The VariablesView for this sidebar.
   */
  variablesView: null,

  /*
   * Whether the sidebar is currently shown.
   */
  visible: false,

  /**
   * Open the sidebar, if not open already, and populate it with the properties
   * of the given object.
   *
   * @param string string
   *        The string that was evaluated.
   * @param object obj
   *        The object to inspect, which is the aEvalString evaluation result.
   * @return Promise
   *         A promise that will resolve once the sidebar is open.
   */
  open(string, obj) {
    this.show();

    return new Promise(resolve => {
      const onTabReady = () => {
        if (this.variablesView) {
          this.variablesView.controller.releaseActors();
        } else {
          const window = this._sidebar.getWindowForTab("variablesview");
          const container = window.document.querySelector("#variables");

          this.variablesView = new VariablesView(container, {
            searchEnabled: true,
            searchPlaceholder: this._scratchpad.strings.GetStringFromName(
              "propertiesFilterPlaceholder"
            ),
          });

          VariablesViewController.attach(this.variablesView, {
            getEnvironmentClient: grip => {
              return new EnvironmentClient(
                this._scratchpad.debuggerClient,
                grip
              );
            },
            getObjectClient: grip => {
              return new ObjectClient(this._scratchpad.debuggerClient, grip);
            },
            getLongStringClient: actor => {
              return this._scratchpad.webConsoleClient.longString(actor);
            },
            releaseActor: actor => {
              // Ignore release failure, since the object actor may have been already GC.
              this._scratchpad.debuggerClient.release(actor).catch(() => {});
            },
          });
        }
        this._update(obj).then(resolve);
      };

      if (this._sidebar.getCurrentTabID() == "variablesview") {
        onTabReady();
      } else {
        this._sidebar.once("variablesview-ready", onTabReady);
        this._sidebar.addTab("variablesview", VARIABLES_VIEW_URL, {
          selected: true,
        });
      }
    });
  },

  /**
   * Show the sidebar.
   */
  show: function SS_show() {
    if (!this.visible) {
      this.visible = true;
      this._sidebar.show();
    }
  },

  /**
   * Hide the sidebar.
   */
  hide: function SS_hide() {
    if (this.visible) {
      this.visible = false;
      this._sidebar.hide();
    }
  },

  /**
   * Destroy the sidebar.
   *
   * @return Promise
   *         The promise that resolves when the sidebar is destroyed.
   */
  destroy: function SS_destroy() {
    if (this.variablesView) {
      this.variablesView.controller.releaseActors();
      this.variablesView = null;
    }
    return this._sidebar.destroy();
  },

  /**
   * Update the object currently inspected by the sidebar.
   *
   * @param any aValue
   *        The JS value to inspect in the sidebar.
   * @return Promise
   *         A promise that resolves when the update completes.
   */
  _update: function SS__update(aValue) {
    let options, onlyEnumVisible;
    if (VariablesView.isPrimitive({ value: aValue })) {
      options = { rawObject: { value: aValue } };
      onlyEnumVisible = true;
    } else {
      options = { objectActor: aValue };
      onlyEnumVisible = false;
    }
    const view = this.variablesView;
    view.onlyEnumVisible = onlyEnumVisible;
    view.empty();
    return view.controller.setSingleVariable(options).expanded;
  },
};

/**
 * Report an error coming over the remote debugger protocol.
 *
 * @param string aAction
 *        The name of the action or method that failed.
 * @param object aResponse
 *        The response packet that contains the error.
 */
function reportError(aAction, aResponse) {
  console.error(
    aAction + " failed: " + aResponse.error + " " + aResponse.message
  );
}

/**
 * The PreferenceObserver listens for preference changes while Scratchpad is
 * running.
 */
var PreferenceObserver = {
  _initialized: false,

  init: function PO_init() {
    if (this._initialized) {
      return;
    }

    this.branch = Services.prefs.getBranch("devtools.scratchpad.");
    this.branch.addObserver("", this);
    this._initialized = true;
  },

  observe: function PO_observe(aMessage, aTopic, aData) {
    if (aTopic != "nsPref:changed") {
      return;
    }

    if (aData == "recentFilesMax") {
      Scratchpad.handleRecentFileMaxChange();
    } else if (aData == "recentFilePaths") {
      Scratchpad.populateRecentFilesMenu();
    }
  },

  uninit: function PO_uninit() {
    if (!this.branch) {
      return;
    }

    this.branch.removeObserver("", this);
    this.branch = null;
  },
};

/**
 * The CloseObserver listens for the last browser window closing and attempts to
 * close the Scratchpad.
 */
var CloseObserver = {
  init: function CO_init() {
    Services.obs.addObserver(this, "browser-lastwindow-close-requested");
  },

  observe: function CO_observe(aSubject) {
    if (Scratchpad.close()) {
      this.uninit();
    } else {
      aSubject.QueryInterface(Ci.nsISupportsPRBool);
      aSubject.data = true;
    }
  },

  uninit: function CO_uninit() {
    // Will throw exception if removeObserver is called twice.
    if (this._uninited) {
      return;
    }

    this._uninited = true;
    Services.obs.removeObserver(this, "browser-lastwindow-close-requested");
  },
};

XPCOMUtils.defineLazyGetter(Scratchpad, "strings", function() {
  return Services.strings.createBundle(SCRATCHPAD_L10N);
});

addEventListener("load", Scratchpad.onLoad.bind(Scratchpad), false);
addEventListener("unload", Scratchpad.onUnload.bind(Scratchpad), false);
addEventListener("close", Scratchpad.onClose.bind(Scratchpad), false);

/**
 * The inputNode "paste" event handler generator. Helps prevent
 * self-xss attacks
 *
 * @param Element inputField
 * @param Element notificationBox
 * @returns A function to be added as a handler to 'paste' and
 *'drop' events on the input field
 */
function pasteHandlerGen(inputField, notificationBox, msg, okstring) {
  const handler = function(event) {
    if (WebConsoleUtils.usageCount >= WebConsoleUtils.CONSOLE_ENTRY_THRESHOLD) {
      inputField.removeEventListener("paste", handler);
      inputField.removeEventListener("drop", handler);
      return true;
    }
    if (notificationBox.getNotificationWithValue("selfxss-notification")) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    const notification = notificationBox.appendNotification(
      msg,
      "selfxss-notification",
      null,
      notificationBox.PRIORITY_WARNING_HIGH,
      null,
      function(eventType) {
        // Cleanup function if notification is dismissed
        if (eventType == "removed") {
          inputField.removeEventListener("keyup", pasteKeyUpHandler);
        }
      }
    );

    function pasteKeyUpHandler() {
      const value = inputField.value || inputField.textContent;
      if (value.includes(okstring)) {
        notificationBox.removeNotification(notification);
        inputField.removeEventListener("keyup", pasteKeyUpHandler);
        WebConsoleUtils.usageCount = WebConsoleUtils.CONSOLE_ENTRY_THRESHOLD;
      }
    }
    inputField.addEventListener("keyup", pasteKeyUpHandler);

    event.preventDefault();
    event.stopPropagation();
    return false;
  };
  return handler;
}
