"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectThread = selectThread;
exports.command = command;
exports.stepIn = stepIn;
exports.stepOver = stepOver;
exports.stepOut = stepOut;
exports.resume = resume;
exports.rewind = rewind;
exports.reverseStepOver = reverseStepOver;
exports.astCommand = astCommand;
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_promise", "devtools/client/debugger/src/actions/utils/middleware/promise");
loader.lazyRequireGetter(this, "_breakpoints", "devtools/client/debugger/src/actions/breakpoints/index");
loader.lazyRequireGetter(this, "_expressions", "devtools/client/debugger/src/actions/expressions");
loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/actions/sources/index");
loader.lazyRequireGetter(this, "_fetchScopes", "devtools/client/debugger/src/actions/pause/fetchScopes");
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
loader.lazyRequireGetter(this, "_telemetry", "devtools/client/debugger/src/utils/telemetry");

var _assert = _interopRequireDefault(require("../../utils/assert"));

loader.lazyRequireGetter(this, "_asyncValue", "devtools/client/debugger/src/utils/async-value");

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
      return dispatch(astCommand(cx, "stepOver"));
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
      return dispatch(astCommand(cx, "reverseStepOver"));
    }
  };
}
/*
 * Checks for await or yield calls on the paused line
 * This avoids potentially expensive parser calls when we are likely
 * not at an async expression.
 */


function hasAwait(content, pauseLocation) {
  const {
    line,
    column
  } = pauseLocation;

  if (!content || !(0, _asyncValue.isFulfilled)(content) || content.value.type !== "text") {
    return false;
  }

  const lineText = content.value.value.split("\n")[line - 1];

  if (!lineText) {
    return false;
  }

  const snippet = lineText.slice(column - 50, column + 50);
  return !!snippet.match(/(yield|await)/);
}
/**
 * @memberOf actions/pause
 * @static
 * @param stepType
 * @returns {function(ThunkArgs)}
 */


function astCommand(cx, stepType) {
  return async ({
    dispatch,
    getState,
    sourceMaps,
    parser
  }) => {
    if (!_prefs.features.asyncStepping) {
      return dispatch(command(cx, stepType));
    }

    if (stepType == "stepOver") {
      // This type definition is ambiguous:
      const frame = (0, _selectors.getTopFrame)(getState(), cx.thread);
      const source = (0, _selectors.getSource)(getState(), frame.location.sourceId);
      const content = source ? (0, _selectors.getSourceContent)(getState(), source.id) : null;

      if (source && hasAwait(content, frame.location)) {
        const nextLocation = await parser.getNextStep(source.id, frame.location);

        if (nextLocation) {
          await dispatch((0, _breakpoints.addHiddenBreakpoint)(cx, nextLocation));
          return dispatch(command(cx, "resume"));
        }
      }
    }

    return dispatch(command(cx, stepType));
  };
}