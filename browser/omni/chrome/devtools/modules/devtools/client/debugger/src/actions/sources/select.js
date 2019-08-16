"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearSelectedLocation = exports.setPendingSelectedLocation = exports.setSelectedLocation = undefined;
exports.selectSourceURL = selectSourceURL;
exports.selectSource = selectSource;
exports.selectLocation = selectLocation;
exports.selectSpecificLocation = selectSpecificLocation;
exports.jumpToMappedLocation = jumpToMappedLocation;
exports.jumpToMappedSelectedLocation = jumpToMappedSelectedLocation;

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/reducers/sources");
loader.lazyRequireGetter(this, "_tabs", "devtools/client/debugger/src/reducers/tabs");
loader.lazyRequireGetter(this, "_symbols", "devtools/client/debugger/src/actions/sources/symbols");
loader.lazyRequireGetter(this, "_ast", "devtools/client/debugger/src/actions/ast/index");
loader.lazyRequireGetter(this, "_ui", "devtools/client/debugger/src/actions/ui");
loader.lazyRequireGetter(this, "_asyncValue", "devtools/client/debugger/src/utils/async-value");
loader.lazyRequireGetter(this, "_prettyPrint", "devtools/client/debugger/src/actions/sources/prettyPrint");
loader.lazyRequireGetter(this, "_tabs2", "devtools/client/debugger/src/actions/tabs");
loader.lazyRequireGetter(this, "_loadSourceText", "devtools/client/debugger/src/actions/sources/loadSourceText");
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");
loader.lazyRequireGetter(this, "_location", "devtools/client/debugger/src/utils/location");
loader.lazyRequireGetter(this, "_sourceMaps", "devtools/client/debugger/src/utils/source-maps");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
const setSelectedLocation = exports.setSelectedLocation = (cx, source, location) => ({
  type: "SET_SELECTED_LOCATION",
  cx,
  source,
  location
}); /* This Source Code Form is subject to the terms of the Mozilla Public
     * License, v. 2.0. If a copy of the MPL was not distributed with this
     * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

const setPendingSelectedLocation = exports.setPendingSelectedLocation = (cx, url, options) => ({
  type: "SET_PENDING_SELECTED_LOCATION",
  cx,
  url: url,
  line: options.location ? options.location.line : null
});

const clearSelectedLocation = exports.clearSelectedLocation = cx => ({
  type: "CLEAR_SELECTED_LOCATION",
  cx
});

/**
 * Deterministically select a source that has a given URL. This will
 * work regardless of the connection status or if the source exists
 * yet.
 *
 * This exists mostly for external things to interact with the
 * debugger.
 *
 * @memberof actions/sources
 * @static
 */
function selectSourceURL(cx, url, options = {}) {
  return async ({ dispatch, getState, sourceMaps }) => {
    const source = (0, _selectors.getSourceByURL)(getState(), url);
    if (!source) {
      return dispatch(setPendingSelectedLocation(cx, url, options));
    }

    const sourceId = source.id;
    const location = (0, _location.createLocation)({ ...options, sourceId });
    return dispatch(selectLocation(cx, location));
  };
}

/**
 * @memberof actions/sources
 * @static
 */
function selectSource(cx, sourceId, options = {}) {
  return async ({ dispatch }) => {
    const location = (0, _location.createLocation)({ ...options, sourceId });
    return dispatch(selectSpecificLocation(cx, location));
  };
}

/**
 * @memberof actions/sources
 * @static
 */
function selectLocation(cx, location, { keepContext = true } = {}) {
  return async ({ dispatch, getState, sourceMaps, client }) => {
    const currentSource = (0, _selectors.getSelectedSource)(getState());

    if (!client) {
      // No connection, do nothing. This happens when the debugger is
      // shut down too fast and it tries to display a default source.
      return;
    }

    let source = (0, _selectors.getSource)(getState(), location.sourceId);
    if (!source) {
      // If there is no source we deselect the current selected source
      return dispatch(clearSelectedLocation(cx));
    }

    const activeSearch = (0, _selectors.getActiveSearch)(getState());
    if (activeSearch && activeSearch !== "file") {
      dispatch((0, _ui.closeActiveSearch)());
    }

    // Preserve the current source map context (original / generated)
    // when navigting to a new location.
    const selectedSource = (0, _selectors.getSelectedSource)(getState());
    if (keepContext && selectedSource && (0, _devtoolsSourceMap.isOriginalId)(selectedSource.id) != (0, _devtoolsSourceMap.isOriginalId)(location.sourceId)) {
      location = await (0, _sourceMaps.mapLocation)(getState(), sourceMaps, location);
      source = (0, _sources.getSourceFromId)(getState(), location.sourceId);
    }

    const tabSources = (0, _tabs.getSourcesForTabs)(getState());
    if (!tabSources.includes(source)) {
      dispatch((0, _tabs2.addTab)(source));
    }

    dispatch(setSelectedLocation(cx, source, location));

    await dispatch((0, _loadSourceText.loadSourceText)({ cx, source }));
    const loadedSource = (0, _selectors.getSource)(getState(), source.id);

    if (!loadedSource) {
      // If there was a navigation while we were loading the loadedSource
      return;
    }
    const sourceWithContent = (0, _sources.getSourceWithContent)(getState(), source.id);
    const sourceContent = sourceWithContent.content && (0, _asyncValue.isFulfilled)(sourceWithContent.content) ? sourceWithContent.content.value : null;

    if (keepContext && _prefs.prefs.autoPrettyPrint && !(0, _selectors.getPrettySource)(getState(), loadedSource.id) && (0, _source.shouldPrettyPrint)(loadedSource, sourceContent || { type: "text", value: "", contentType: undefined }) && (0, _source.isMinified)(sourceWithContent)) {
      await dispatch((0, _prettyPrint.togglePrettyPrint)(cx, loadedSource.id));
      dispatch((0, _tabs2.closeTab)(cx, loadedSource));
    }

    dispatch((0, _symbols.setSymbols)({ cx, source: loadedSource }));
    dispatch((0, _ast.setInScopeLines)(cx));

    // If a new source is selected update the file search results
    const newSource = (0, _selectors.getSelectedSource)(getState());
    if (currentSource && currentSource !== newSource) {
      dispatch((0, _ui.updateActiveFileSearch)(cx));
    }
  };
}

/**
 * @memberof actions/sources
 * @static
 */
function selectSpecificLocation(cx, location) {
  return selectLocation(cx, location, { keepContext: false });
}

/**
 * @memberof actions/sources
 * @static
 */
function jumpToMappedLocation(cx, location) {
  return async function ({ dispatch, getState, client, sourceMaps }) {
    if (!client) {
      return;
    }

    const pairedLocation = await (0, _sourceMaps.mapLocation)(getState(), sourceMaps, location);

    return dispatch(selectSpecificLocation(cx, { ...pairedLocation }));
  };
}

function jumpToMappedSelectedLocation(cx) {
  return async function ({ dispatch, getState }) {
    const location = (0, _selectors.getSelectedLocation)(getState());
    if (!location) {
      return;
    }

    await dispatch(jumpToMappedLocation(cx, location));
  };
}