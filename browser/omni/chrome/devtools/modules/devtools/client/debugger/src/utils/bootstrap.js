"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bootstrapStore = bootstrapStore;
exports.bootstrapWorkers = bootstrapWorkers;
exports.teardownWorkers = teardownWorkers;
exports.bootstrapApp = bootstrapApp;

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _redux = require("devtools/client/shared/vendor/redux");

var _reactDom = require("devtools/client/shared/vendor/react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _storeProvider = require("devtools/client/framework/store-provider");

var _storeProvider2 = _interopRequireDefault(_storeProvider);

var _devtoolsEnvironment = require("devtools/client/debugger/dist/vendors").vendored["devtools-environment"];

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

var _devtoolsSourceMap2 = _interopRequireDefault(_devtoolsSourceMap);

loader.lazyRequireGetter(this, "_search", "devtools/client/debugger/src/workers/search/index");

var search = _interopRequireWildcard(_search);

loader.lazyRequireGetter(this, "_prettyPrint", "devtools/client/debugger/src/workers/pretty-print/index");

var prettyPrint = _interopRequireWildcard(_prettyPrint);

loader.lazyRequireGetter(this, "_parser", "devtools/client/debugger/src/workers/parser/index");
loader.lazyRequireGetter(this, "_createStore", "devtools/client/debugger/src/actions/utils/create-store");

var _createStore2 = _interopRequireDefault(_createStore);

loader.lazyRequireGetter(this, "_reducers", "devtools/client/debugger/src/reducers/index");

var _reducers2 = _interopRequireDefault(_reducers);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

var selectors = _interopRequireWildcard(_selectors);

loader.lazyRequireGetter(this, "_App", "devtools/client/debugger/src/components/App");

var _App2 = _interopRequireDefault(_App);

loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { Provider } = require("devtools/client/shared/vendor/react-redux"); /* This Source Code Form is subject to the terms of the Mozilla Public
                                                                            * License, v. 2.0. If a copy of the MPL was not distributed with this
                                                                            * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

let parser;

function renderPanel(component, store, panel) {
  const root = document.createElement("div");
  root.className = "launchpad-root theme-body";
  root.style.setProperty("flex", "1");
  const mount = document.querySelector("#mount");
  if (!mount) {
    return;
  }
  mount.appendChild(root);

  _reactDom2.default.render(_react2.default.createElement(Provider, { store }, _react2.default.createElement(_storeProvider2.default, { store: panel.getToolboxStore() }, _react2.default.createElement(component))), root);
}

function bootstrapStore(client, workers, panel, initialState) {
  const createStore = (0, _createStore2.default)({
    log: _prefs.prefs.logging || (0, _devtoolsEnvironment.isTesting)(),
    timing: (0, _devtoolsEnvironment.isDevelopment)(),
    makeThunkArgs: (args, state) => {
      return { ...args, client, ...workers, panel };
    }
  });

  const store = createStore((0, _redux.combineReducers)(_reducers2.default), initialState);
  store.subscribe(() => updatePrefs(store.getState()));

  const actions = (0, _redux.bindActionCreators)(require("../actions/index").default, store.dispatch);

  return { store, actions, selectors };
}

function bootstrapWorkers(panelWorkers) {
  const workerPath = (0, _devtoolsEnvironment.isDevelopment)() ? "assets/build" : "resource://devtools/client/debugger/dist";

  if ((0, _devtoolsEnvironment.isDevelopment)()) {
    // When used in Firefox, the toolbox manages the source map worker.
    (0, _devtoolsSourceMap.startSourceMapWorker)(`${workerPath}/source-map-worker.js`,
    // This is relative to the worker itself.
    "./source-map-worker-assets/");
  }

  prettyPrint.start(`${workerPath}/pretty-print-worker.js`);
  parser = new _parser.ParserDispatcher();

  parser.start(`${workerPath}/parser-worker.js`);
  search.start(`${workerPath}/search-worker.js`);
  return { ...panelWorkers, prettyPrint, parser, search };
}

function teardownWorkers() {
  if (!(0, _devtoolsEnvironment.isFirefoxPanel)()) {
    // When used in Firefox, the toolbox manages the source map worker.
    (0, _devtoolsSourceMap.stopSourceMapWorker)();
  }
  prettyPrint.stop();
  parser.stop();
  search.stop();
}

function bootstrapApp(store, panel) {
  if ((0, _devtoolsEnvironment.isFirefoxPanel)()) {
    renderPanel(_App2.default, store, panel);
  } else {
    const { renderRoot } = require("devtools/shared/flags");
    renderRoot(_react2.default, _reactDom2.default, _App2.default, store);
  }
}

let currentPendingBreakpoints;
let currentXHRBreakpoints;
let currentEventBreakpoints;
function updatePrefs(state) {
  const previousPendingBreakpoints = currentPendingBreakpoints;
  const previousXHRBreakpoints = currentXHRBreakpoints;
  const previousEventBreakpoints = currentEventBreakpoints;
  currentPendingBreakpoints = selectors.getPendingBreakpoints(state);
  currentXHRBreakpoints = selectors.getXHRBreakpoints(state);
  currentEventBreakpoints = state.eventListenerBreakpoints;

  if (previousPendingBreakpoints && currentPendingBreakpoints !== previousPendingBreakpoints) {
    _prefs.asyncStore.pendingBreakpoints = currentPendingBreakpoints;
  }

  if (previousEventBreakpoints && previousEventBreakpoints !== currentEventBreakpoints) {
    _prefs.asyncStore.eventListenerBreakpoints = currentEventBreakpoints;
  }

  if (currentXHRBreakpoints !== previousXHRBreakpoints) {
    _prefs.asyncStore.xhrBreakpoints = currentXHRBreakpoints;
  }
}