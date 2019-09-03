"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialThreadsState = initialThreadsState;
exports.default = update;
exports.getWorkerByThread = getWorkerByThread;
exports.getMainThread = getMainThread;
exports.getDebuggeeUrl = getDebuggeeUrl;
exports.startsWithThreadActor = startsWithThreadActor;
exports.getAllThreads = exports.getWorkerCount = exports.getThreads = void 0;

var _lodash = require("devtools/client/shared/vendor/lodash");

var _reselect = require("devtools/client/shared/vendor/reselect");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Threads reducer
 * @module reducers/threads
 */
function initialThreadsState() {
  return {
    threads: [],
    mainThread: {
      actor: "",
      url: "",
      type: "mainThread",
      name: ""
    },
    isWebExtension: false
  };
}

function update(state = initialThreadsState(), action) {
  switch (action.type) {
    case "CONNECT":
      return { ...state,
        mainThread: action.mainThread,
        isWebExtension: action.isWebExtension
      };

    case "INSERT_THREADS":
      return { ...state,
        threads: [...state.threads, ...action.threads]
      };

    case "REMOVE_THREADS":
      const {
        threads
      } = action;
      return { ...state,
        threads: state.threads.filter(w => !threads.includes(w.actor))
      };

    case "NAVIGATE":
      return { ...initialThreadsState(),
        mainThread: action.mainThread
      };

    default:
      return state;
  }
}

const getThreads = state => state.threads.threads;

exports.getThreads = getThreads;

const getWorkerCount = state => getThreads(state).length;

exports.getWorkerCount = getWorkerCount;

function getWorkerByThread(state, thread) {
  return getThreads(state).find(worker => worker.actor == thread);
}

function getMainThread(state) {
  return state.threads.mainThread;
}

function getDebuggeeUrl(state) {
  return getMainThread(state).url;
}

const getAllThreads = (0, _reselect.createSelector)(getMainThread, getThreads, (mainThread, threads) => [mainThread, ...(0, _lodash.sortBy)(threads, thread => thread.name)]); // checks if a path begins with a thread actor
// e.g "server1.conn0.child1/workerTarget22/context1/dbg-workers.glitch.me"

exports.getAllThreads = getAllThreads;

function startsWithThreadActor(state, path) {
  const threadActors = getAllThreads(state).map(t => t.actor);
  const match = path.match(new RegExp(`(${threadActors.join("|")})\/(.*)`));
  return match && match[1];
}