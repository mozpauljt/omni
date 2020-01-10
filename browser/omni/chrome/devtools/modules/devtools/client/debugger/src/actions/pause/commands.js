"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectThread = selectThread;
exports.command = command;
exports.seekToPosition = seekToPosition;
exports.stepIn = stepIn;
exports.stepOver = stepOver;
exports.stepOut = stepOut;
exports.resume = resume;
exports.rewind = rewind;
exports.reverseStepOver = reverseStepOver;
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_promise", "devtools/client/debugger/src/actions/utils/middleware/promise");
loader.lazyRequireGetter(this, "_expressions", "devtools/client/debugger/src/actions/expressions");
loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/actions/sources/index");
loader.lazyRequireGetter(this, "_fetchScopes", "devtools/client/debugger/src/actions/pause/fetchScopes");
loader.lazyRequireGetter(this, "_fetchFrames", "devtools/client/debugger/src/actions/pause/fetchFrames");
loader.lazyRequireGetter(this, "_telemetry", "devtools/client/debugger/src/utils/telemetry");

var _assert = _interopRequireDefault(require("../../utils/assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
function selectThread(cx, thread) {
  return async ({
    dispatch,
    getState,
    client
  }) => {
    await dispatch({
      cx,
      type: "SELECT_THREAD",
      thread
    }); // Get a new context now that the current thread has changed.

    const threadcx = (0, _selectors.getThreadContext)(getState());
    (0, _assert.default)(threadcx.thread == thread, "Thread mismatch");
    const serverRequests = [];
    serverRequests.push(dispatch((0, _expressions.evaluateExpressions)(threadcx)));
    const frame = (0, _selectors.getSelectedFrame)(getState(), thread);

    if (frame) {
      serverRequests.push(dispatch((0, _sources.selectLocation)(threadcx, frame.location)));
      serverRequests.push(dispatch((0, _fetchFrames.fetchFrames)(threadcx)));
      serverRequests.push(dispatch((0, _fetchScopes.fetchScopes)(threadcx)));
    }

    await Promise.all(serverRequests);
  };
}
/**
 * Debugger commands like stepOver, stepIn, stepUp
 *
 * @param string $0.type
 * @memberof actions/pause
 * @static
 */


function command(cx, type) {
  return async ({
    dispatch,
    getState,
    client
  }) => {
    if (type) {
      return dispatch({
        type: "COMMAND",
        command: type,
        cx,
        thread: cx.thread,
        [_promise.PROMISE]: client[type](cx.thread)
      });
    }
  };
}

function seekToPosition(position) {
  return ({
    dispatch,
    getState,
    client
  }) => {
    const cx = (0, _selectors.getThreadContext)(getState());
    client.timeWarp(position);
    dispatch({
      type: "COMMAND",
      command: "timeWarp",
      status: "start",
      thread: cx.thread
    });
  };
}
/**
 * StepIn
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */


function stepIn(cx) {
  return ({
    dispatch,
    getState
  }) => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepIn"));
    }
  };
}
/**
 * stepOver
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */


function stepOver(cx) {
  return ({
    dispatch,
    getState
  }) => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOver"));
    }
  };
}
/**
 * stepOut
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */


function stepOut(cx) {
  return ({
    dispatch,
    getState
  }) => {
    if (cx.isPaused) {
      return dispatch(command(cx, "stepOut"));
    }
  };
}
/**
 * resume
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */


function resume(cx) {
  return ({
    dispatch,
    getState
  }) => {
    if (cx.isPaused) {
      (0, _telemetry.recordEvent)("continue");
      return dispatch(command(cx, "resume"));
    }
  };
}
/**
 * rewind
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */


function rewind(cx) {
  return ({
    dispatch,
    getState
  }) => {
    if (cx.isPaused) {
      return dispatch(command(cx, "rewind"));
    }
  };
}
/**
 * reverseStepOver
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */


function reverseStepOver(cx) {
  return ({
    dispatch,
    getState
  }) => {
    if (cx.isPaused) {
      return dispatch(command(cx, "reverseStepOver"));
    }
  };
}