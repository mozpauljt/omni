/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set ft= javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cc, Ci} = require("chrome");
const Services = require("Services");

// Number of terminal entries for the self-xss prevention to go away
const CONSOLE_ENTRY_THRESHOLD = 5;

var WebConsoleUtils = {

  CONSOLE_ENTRY_THRESHOLD,

  /**
   * Wrap a string in an nsISupportsString object.
   *
   * @param string string
   * @return nsISupportsString
   */
  supportsString: function(string) {
    const str = Cc["@mozilla.org/supports-string;1"]
              .createInstance(Ci.nsISupportsString);
    str.data = string;
    return str;
  },

  /**
   * Copies certain style attributes from one element to another.
   *
   * @param Node from
   *        The target node.
   * @param Node to
   *        The destination node.
   */
  copyTextStyles: function(from, to) {
    const win = from.ownerDocument.defaultView;
    const style = win.getComputedStyle(from);
    to.style.fontFamily = style.fontFamily;
    to.style.fontSize = style.fontSize;
    to.style.fontWeight = style.fontWeight;
    to.style.fontStyle = style.fontStyle;
  },

  /**
   * Value of devtools.selfxss.count preference
   *
   * @type number
   * @private
   */
  _usageCount: 0,
  get usageCount() {
    if (WebConsoleUtils._usageCount < CONSOLE_ENTRY_THRESHOLD) {
      WebConsoleUtils._usageCount =
        Services.prefs.getIntPref("devtools.selfxss.count");
      if (Services.prefs.getBoolPref("devtools.chrome.enabled")) {
        WebConsoleUtils.usageCount = CONSOLE_ENTRY_THRESHOLD;
      }
    }
    return WebConsoleUtils._usageCount;
  },
  set usageCount(newUC) {
    if (newUC <= CONSOLE_ENTRY_THRESHOLD) {
      WebConsoleUtils._usageCount = newUC;
      Services.prefs.setIntPref("devtools.selfxss.count", newUC);
    }
  },
};

exports.Utils = WebConsoleUtils;

