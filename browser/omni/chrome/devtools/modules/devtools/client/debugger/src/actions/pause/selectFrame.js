"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectFrame = selectFrame;
loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/actions/sources/index");
loader.lazyRequireGetter(this, "_expressions", "devtools/client/debugger/src/actions/expressions");
loader.lazyRequireGetter(this, "_fetchScopes", "devtools/client/debugger/src/actions/pause/fetchScopes");
loader.lazyRequireGetter(this, "_assert", "devtools/client/debugger/src/utils/assert");

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @memberof actions/pause
 * @static
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function selectFrame(cx, frame) {
  return async ({ dispatch, client, getState, sourceMaps }) => {
    (0, _assert2.default)(cx.thread == frame.thread, "Thread mismatch");

    dispatch({
      type: "SELECT_FRAME",
      cx,
      thread: cx.thread,
      frame
    });

    dispatch((0, _sources.selectLocation)(cx, frame.location));
    dispatch((0, _expressions.evaluateExpressions)(cx));
    dispatch((0, _fetchScopes.fetchScopes)(cx));
  };
}