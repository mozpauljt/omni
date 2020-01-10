"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateThreads = updateThreads;
exports.ensureHasThread = ensureHasThread;

var _lodash = require("devtools/client/shared/vendor/lodash");

loader.lazyRequireGetter(this, "_sourceActors", "devtools/client/debugger/src/actions/source-actors");
loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/actions/sources/index");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
function updateThreads() {
  return async function ({
    dispatch,
    getState,
    client
  }) {
    const cx = (0, _selectors.getContext)(getState());
    const threads = await client.fetchThreads();
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
      }); // Fetch the sources and install breakpoints on any new workers.
      // NOTE: This runs in the background and fails quietly because it is
      // pretty easy for sources to throw during the fetch if their thread
      // shuts down, which would cause test failures.

      for (const thread of addedThreads) {
        client.fetchThreadSources(thread.actor).then(sources => dispatch((0, _sources.newGeneratedSources)(sources))).catch(e => console.error(e));
      }
    } // Update the status of any service workers.


    for (const thread of currentThreads) {
      if (thread.serviceWorkerStatus) {
        for (const fetchedThread of threads) {
          if (fetchedThread.actor == thread.actor && fetchedThread.serviceWorkerStatus != thread.serviceWorkerStatus) {
            dispatch({
              type: "UPDATE_SERVICE_WORKER_STATUS",
              cx,
              thread: thread.actor,
              status: fetchedThread.serviceWorkerStatus
            });
          }
        }
      }
    }
  };
}

function ensureHasThread(thread) {
  return async function ({
    dispatch,
    getState,
    client
  }) {
    const currentThreads = (0, _selectors.getAllThreads)(getState());

    if (!currentThreads.some(t => t.actor == thread)) {
      await dispatch(updateThreads());
    }
  };
}