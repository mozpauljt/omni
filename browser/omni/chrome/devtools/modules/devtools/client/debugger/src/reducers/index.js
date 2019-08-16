"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
loader.lazyRequireGetter(this, "_expressions", "devtools/client/debugger/src/reducers/expressions");

var _expressions2 = _interopRequireDefault(_expressions);

loader.lazyRequireGetter(this, "_sourceActors", "devtools/client/debugger/src/reducers/source-actors");

var _sourceActors2 = _interopRequireDefault(_sourceActors);

loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/reducers/sources");

var _sources2 = _interopRequireDefault(_sources);

loader.lazyRequireGetter(this, "_tabs", "devtools/client/debugger/src/reducers/tabs");

var _tabs2 = _interopRequireDefault(_tabs);

loader.lazyRequireGetter(this, "_breakpoints", "devtools/client/debugger/src/reducers/breakpoints");

var _breakpoints2 = _interopRequireDefault(_breakpoints);

loader.lazyRequireGetter(this, "_pendingBreakpoints", "devtools/client/debugger/src/reducers/pending-breakpoints");

var _pendingBreakpoints2 = _interopRequireDefault(_pendingBreakpoints);

loader.lazyRequireGetter(this, "_asyncRequests", "devtools/client/debugger/src/reducers/async-requests");

var _asyncRequests2 = _interopRequireDefault(_asyncRequests);

loader.lazyRequireGetter(this, "_pause", "devtools/client/debugger/src/reducers/pause");

var _pause2 = _interopRequireDefault(_pause);

loader.lazyRequireGetter(this, "_ui", "devtools/client/debugger/src/reducers/ui");

var _ui2 = _interopRequireDefault(_ui);

loader.lazyRequireGetter(this, "_fileSearch", "devtools/client/debugger/src/reducers/file-search");

var _fileSearch2 = _interopRequireDefault(_fileSearch);

loader.lazyRequireGetter(this, "_ast", "devtools/client/debugger/src/reducers/ast");

var _ast2 = _interopRequireDefault(_ast);

loader.lazyRequireGetter(this, "_preview", "devtools/client/debugger/src/reducers/preview");

var _preview2 = _interopRequireDefault(_preview);

loader.lazyRequireGetter(this, "_projectTextSearch", "devtools/client/debugger/src/reducers/project-text-search");

var _projectTextSearch2 = _interopRequireDefault(_projectTextSearch);

loader.lazyRequireGetter(this, "_quickOpen", "devtools/client/debugger/src/reducers/quick-open");

var _quickOpen2 = _interopRequireDefault(_quickOpen);

loader.lazyRequireGetter(this, "_sourceTree", "devtools/client/debugger/src/reducers/source-tree");

var _sourceTree2 = _interopRequireDefault(_sourceTree);

loader.lazyRequireGetter(this, "_debuggee", "devtools/client/debugger/src/reducers/debuggee");

var _debuggee2 = _interopRequireDefault(_debuggee);

loader.lazyRequireGetter(this, "_eventListeners", "devtools/client/debugger/src/reducers/event-listeners");

var _eventListeners2 = _interopRequireDefault(_eventListeners);

var _devtoolsReps = require("devtools/client/shared/components/reps/reps.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Reducer index
 * @module reducers/index
 */

exports.default = {
  expressions: _expressions2.default,
  sourceActors: _sourceActors2.default,
  sources: _sources2.default,
  tabs: _tabs2.default,
  breakpoints: _breakpoints2.default,
  pendingBreakpoints: _pendingBreakpoints2.default,
  asyncRequests: _asyncRequests2.default,
  pause: _pause2.default,
  ui: _ui2.default,
  fileSearch: _fileSearch2.default,
  ast: _ast2.default,
  projectTextSearch: _projectTextSearch2.default,
  quickOpen: _quickOpen2.default,
  sourceTree: _sourceTree2.default,
  debuggee: _debuggee2.default,
  objectInspector: _devtoolsReps.objectInspector.reducer.default,
  eventListenerBreakpoints: _eventListeners2.default,
  preview: _preview2.default
};

// eslint-disable-next-line import/named