"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSymbols = undefined;
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_promise", "devtools/client/debugger/src/actions/utils/middleware/promise");
loader.lazyRequireGetter(this, "_tabs", "devtools/client/debugger/src/actions/tabs");
loader.lazyRequireGetter(this, "_loadSourceText", "devtools/client/debugger/src/actions/sources/loadSourceText");
loader.lazyRequireGetter(this, "_memoizableAction", "devtools/client/debugger/src/utils/memoizableAction");


async function doSetSymbols(cx, source, { dispatch, getState, parser }) {
  const sourceId = source.id;

  await dispatch((0, _loadSourceText.loadSourceText)({ cx, source }));

  await dispatch({
    type: "SET_SYMBOLS",
    cx,
    sourceId,
    [_promise.PROMISE]: parser.getSymbols(sourceId)
  });

  const symbols = (0, _selectors.getSymbols)(getState(), source);
  if (symbols && symbols.framework) {
    dispatch((0, _tabs.updateTab)(source, symbols.framework));
  }

  return symbols;
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const setSymbols = exports.setSymbols = (0, _memoizableAction.memoizeableAction)("setSymbols", {
  exitEarly: ({ source }) => source.isWasm,
  hasValue: ({ source }, { getState }) => (0, _selectors.hasSymbols)(getState(), source),
  getValue: ({ source }, { getState }) => (0, _selectors.getSymbols)(getState(), source),
  createKey: ({ source }) => source.id,
  action: ({ cx, source }, thunkArgs) => doSetSymbols(cx, source, thunkArgs)
});