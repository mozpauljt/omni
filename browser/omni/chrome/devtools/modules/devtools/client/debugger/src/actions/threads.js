"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateThreads = updateThreads;

var _lodash = require("devtools/client/shared/vendor/lodash");

loader.lazyRequireGetter(this, "_sourceActors", "devtools/client/debugger/src/actions/source-actors");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
function updateThreads(type) {
  return async function ({
    dispatch,
    getState,
    client
  }) {
    const cx = (0, _selectors.getContext)(getState());
    const threads = await client.fetchThreads(type);
    const currentThreads = (0, _selectors.getThreads)(getState());
    const addedThreads = (0, _lodash.differenceBy)(threads, currentThreads, t => t.actor);
    const removedThreads = (0, _lodash.differenceBy)(currentThreads, threads, t => t.actor);

    if (removedThreads.length > 0) {
      const sourceActors = (0, _selectors.getSourceActorsForThread)(getState(), removedThreads.map(t => t.actor));
      dispatch((0, _sourceActors.removeSourceActors)(sourceActors));
      dispatch({
        type: "REMOVE_THREADS",
        cx,
        threads: removedThreads.map(t => t.actor)
      });
    }

    if (addedThreads.length > 0) {
      dispatch({
        type: "INSERT_THREADS",
        cx,
        threads: addedThreads
      });
    }
  };
}