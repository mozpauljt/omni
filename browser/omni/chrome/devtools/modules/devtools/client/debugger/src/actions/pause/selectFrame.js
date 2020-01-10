"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectFrame = selectFrame;
loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/actions/sources/index");
loader.lazyRequireGetter(this, "_expressions", "devtools/client/debugger/src/actions/expressions");
loader.lazyRequireGetter(this, "_fetchScopes", "devtools/client/debugger/src/actions/pause/fetchScopes");

var _assert = _interopRequireDefault(require("../../utils/assert"));

loader.lazyRequireGetter(this, "_threads", "devtools/client/debugger/src/reducers/threads");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * @memberof actions/pause
 * @static
 */
function selectFrame(cx, frame) {
  return async ({
    dispatch,
    client,
    getState,
    sourceMaps
  }) => {
    (0, _assert.default)(cx.thread == frame.thread, "Thread mismatch"); // Frames with an async cause are not selected

    if (frame.asyncCause) {
      return dispatch((0, _sources.selectLocation)(cx, frame.location));
    }

    dispatch({
      type: "SELECT_FRAME",
      cx,
      thread: cx.thread,
      frame
    });

    if ((0, _threads.getCanRewind)(getState())) {
      client.fetchAncestorFramePositions(frame.index);
    }

    dispatch((0, _sources.selectLocation)(cx, frame.location));
    dispatch((0, _expressions.evaluateExpressions)(cx));
    dispatch((0, _fetchScopes.fetchScopes)(cx));
  };
}