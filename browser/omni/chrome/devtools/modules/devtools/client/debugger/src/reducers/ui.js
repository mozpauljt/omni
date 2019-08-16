"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createUIState = undefined;
exports.getSelectedPrimaryPaneTab = getSelectedPrimaryPaneTab;
exports.getActiveSearch = getActiveSearch;
exports.getFrameworkGroupingState = getFrameworkGroupingState;
exports.getShownSource = getShownSource;
exports.getPaneCollapse = getPaneCollapse;
exports.getHighlightedLineRange = getHighlightedLineRange;
exports.getConditionalPanelLocation = getConditionalPanelLocation;
exports.getLogPointStatus = getLogPointStatus;
exports.getOrientation = getOrientation;
exports.getViewport = getViewport;
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
const createUIState = exports.createUIState = () => ({
  selectedPrimaryPaneTab: "sources",
  activeSearch: null,
  shownSource: null,
  startPanelCollapsed: _prefs.prefs.startPanelCollapsed,
  endPanelCollapsed: _prefs.prefs.endPanelCollapsed,
  frameworkGroupingOn: _prefs.prefs.frameworkGroupingOn,
  highlightedLineRange: undefined,
  conditionalPanelLocation: null,
  isLogPoint: false,
  orientation: "horizontal",
  viewport: null
}); /* This Source Code Form is subject to the terms of the Mozilla Public
     * License, v. 2.0. If a copy of the MPL was not distributed with this
     * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * UI reducer
 * @module reducers/ui
 */

function update(state = createUIState(), action) {
  switch (action.type) {
    case "TOGGLE_ACTIVE_SEARCH":
      {
        return { ...state, activeSearch: action.value };
      }

    case "TOGGLE_FRAMEWORK_GROUPING":
      {
        _prefs.prefs.frameworkGroupingOn = action.value;
        return { ...state, frameworkGroupingOn: action.value };
      }

    case "SET_ORIENTATION":
      {
        return { ...state, orientation: action.orientation };
      }

    case "SHOW_SOURCE":
      {
        return { ...state, shownSource: action.source };
      }

    case "TOGGLE_PANE":
      {
        if (action.position == "start") {
          _prefs.prefs.startPanelCollapsed = action.paneCollapsed;
          return { ...state, startPanelCollapsed: action.paneCollapsed };
        }

        _prefs.prefs.endPanelCollapsed = action.paneCollapsed;
        return { ...state, endPanelCollapsed: action.paneCollapsed };
      }

    case "HIGHLIGHT_LINES":
      const { start, end, sourceId } = action.location;
      let lineRange = {};

      if (start && end && sourceId) {
        lineRange = { start, end, sourceId };
      }

      return { ...state, highlightedLineRange: lineRange };

    case "CLOSE_QUICK_OPEN":
    case "CLEAR_HIGHLIGHT_LINES":
      return { ...state, highlightedLineRange: {} };

    case "OPEN_CONDITIONAL_PANEL":
      return {
        ...state,
        conditionalPanelLocation: action.location,
        isLogPoint: action.log
      };

    case "CLOSE_CONDITIONAL_PANEL":
      return { ...state, conditionalPanelLocation: null };

    case "SET_PRIMARY_PANE_TAB":
      return { ...state, selectedPrimaryPaneTab: action.tabName };

    case "CLOSE_PROJECT_SEARCH":
      {
        if (state.activeSearch === "project") {
          return { ...state, activeSearch: null };
        }
        return state;
      }

    case "SET_VIEWPORT":
      {
        return { ...state, viewport: action.viewport };
      }

    case "NAVIGATE":
      {
        return { ...state, activeSearch: null, highlightedLineRange: {} };
      }

    default:
      {
        return state;
      }
  }
}

// NOTE: we'd like to have the app state fully typed
// https://github.com/firefox-devtools/debugger/blob/master/src/reducers/sources.js#L179-L185
function getSelectedPrimaryPaneTab(state) {
  return state.ui.selectedPrimaryPaneTab;
}

function getActiveSearch(state) {
  return state.ui.activeSearch;
}

function getFrameworkGroupingState(state) {
  return state.ui.frameworkGroupingOn;
}

function getShownSource(state) {
  return state.ui.shownSource;
}

function getPaneCollapse(state, position) {
  if (position == "start") {
    return state.ui.startPanelCollapsed;
  }

  return state.ui.endPanelCollapsed;
}

function getHighlightedLineRange(state) {
  return state.ui.highlightedLineRange;
}

function getConditionalPanelLocation(state) {
  return state.ui.conditionalPanelLocation;
}

function getLogPointStatus(state) {
  return state.ui.isLogPoint;
}

function getOrientation(state) {
  return state.ui.orientation;
}

function getViewport(state) {
  return state.ui.viewport;
}

exports.default = update;