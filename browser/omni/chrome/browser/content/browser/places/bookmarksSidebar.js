/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Shared Places Import - change other consumers if you change this: */
var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
var {XPCOMUtils} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetters(this, {
  LightweightThemeChild: "resource:///actors/LightweightThemeChild.jsm",
  PlacesUtils: "resource://gre/modules/PlacesUtils.jsm",
  PlacesUIUtils: "resource:///modules/PlacesUIUtils.jsm",
  PlacesTransactions: "resource://gre/modules/PlacesTransactions.jsm",
  PrivateBrowsingUtils: "resource://gre/modules/PrivateBrowsingUtils.jsm",
});
XPCOMUtils.defineLazyScriptGetter(this, "PlacesTreeView",
                                  "chrome://browser/content/places/treeView.js");
XPCOMUtils.defineLazyScriptGetter(this, ["PlacesInsertionPoint", "PlacesController",
                                         "PlacesControllerDragHelper"],
                                  "chrome://browser/content/places/controller.js");
/* End Shared Places Import */

function init() {
  let uidensity = window.top.document.documentElement.getAttribute("uidensity");
  if (uidensity) {
    document.documentElement.setAttribute("uidensity", uidensity);
  }

  /* Listen for sidebar theme changes */
  let themeListener = new LightweightThemeChild({
    content: window,
    chromeOuterWindowID: window.top.windowUtils.outerWindowID,
    docShell: window.docShell,
  });

  window.addEventListener("unload", () => {
    themeListener.cleanup();
  });

  document.getElementById("bookmarks-view").place =
    "place:type=" + Ci.nsINavHistoryQueryOptions.RESULTS_AS_ROOTS_QUERY;
}

function searchBookmarks(aSearchString) {
  var tree = document.getElementById("bookmarks-view");
  if (!aSearchString) {
    // eslint-disable-next-line no-self-assign
    tree.place = tree.place;
  } else {
    tree.applyFilter(aSearchString,
                     PlacesUtils.bookmarks.userContentRoots);
  }
}

window.addEventListener("SidebarFocused",
                        () => document.getElementById("search-box").focus());
