"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.willNavigate = willNavigate;
exports.connect = connect;
exports.navigated = navigated;
loader.lazyRequireGetter(this, "_editor", "devtools/client/debugger/src/utils/editor/index");

var _sourceQueue = _interopRequireDefault(require("../utils/source-queue"));

loader.lazyRequireGetter(this, "_threads", "devtools/client/debugger/src/actions/threads");
loader.lazyRequireGetter(this, "_wasm", "devtools/client/debugger/src/utils/wasm");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Redux actions for the navigation state
 * @module actions/navigation
 */

/**
 * @memberof actions/navigation
 * @static
 */
function willNavigate(event) {
  return async function ({
    dispatch,
    getState,
    client,
    sourceMaps,
    parser
  }) {
    _sourceQueue.default.clear();

    sourceMaps.clearSourceMaps();
    (0, _wasm.clearWasmStates)();
    (0, _editor.clearDocuments)();
    parser.clear();
    client.detachWorkers();
    const thread = (0, _selectors.getMainThread)(getState());
    dispatch({
      type: "NAVIGATE",
      mainThread: { ...thread,
        url: event.url
      }
    });
  };
}

function connect(url, actor, canRewind, isWebExtension) {
  return async function ({
    dispatch
  }) {
    await dispatch((0, _threads.updateThreads)());
    dispatch({
      type: "CONNECT",
      mainThread: {
        url,
        actor,
        type: "mainThread",
        name: L10N.getStr("mainThread")
      },
      canRewind,
      isWebExtension
    });
  };
}
/**
 * @memberof actions/navigation
 * @static
 */


function navigated() {
  return async function ({
    panel
  }) {
    panel.emit("reloaded");
  };
}