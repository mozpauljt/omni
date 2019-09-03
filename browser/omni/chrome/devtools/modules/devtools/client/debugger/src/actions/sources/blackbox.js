"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toggleBlackBox = toggleBlackBox;

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

loader.lazyRequireGetter(this, "_telemetry", "devtools/client/debugger/src/utils/telemetry");
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_promise", "devtools/client/debugger/src/actions/utils/middleware/promise");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Redux actions for the sources state
 * @module actions/sources
 */
async function blackboxActors(state, client, sourceId, isBlackBoxed, range) {
  for (const actor of (0, _selectors.getSourceActorsForSource)(state, sourceId)) {
    await client.blackBox(actor, isBlackBoxed, range);
  }

  return {
    isBlackBoxed: !isBlackBoxed
  };
}

function toggleBlackBox(cx, source) {
  return async ({
    dispatch,
    getState,
    client,
    sourceMaps
  }) => {
    const {
      isBlackBoxed
    } = source;

    if (!isBlackBoxed) {
      (0, _telemetry.recordEvent)("blackbox");
    }

    let sourceId, range;

    if (_prefs.features.originalBlackbox && (0, _devtoolsSourceMap.isOriginalId)(source.id)) {
      range = await sourceMaps.getFileGeneratedRange(source.id);
      sourceId = (0, _devtoolsSourceMap.originalToGeneratedId)(source.id);
    } else {
      sourceId = source.id;
    }

    return dispatch({
      type: "BLACKBOX",
      cx,
      source,
      [_promise.PROMISE]: blackboxActors(getState(), client, sourceId, isBlackBoxed, range)
    });
  };
}