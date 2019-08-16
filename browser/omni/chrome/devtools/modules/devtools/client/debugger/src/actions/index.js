"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
loader.lazyRequireGetter(this, "_ast", "devtools/client/debugger/src/actions/ast/index");

var ast = _interopRequireWildcard(_ast);

loader.lazyRequireGetter(this, "_breakpoints", "devtools/client/debugger/src/actions/breakpoints/index");

var breakpoints = _interopRequireWildcard(_breakpoints);

loader.lazyRequireGetter(this, "_expressions", "devtools/client/debugger/src/actions/expressions");

var expressions = _interopRequireWildcard(_expressions);

loader.lazyRequireGetter(this, "_eventListeners", "devtools/client/debugger/src/actions/event-listeners");

var eventListeners = _interopRequireWildcard(_eventListeners);

loader.lazyRequireGetter(this, "_pause", "devtools/client/debugger/src/actions/pause/index");

var pause = _interopRequireWildcard(_pause);

loader.lazyRequireGetter(this, "_navigation", "devtools/client/debugger/src/actions/navigation");

var navigation = _interopRequireWildcard(_navigation);

loader.lazyRequireGetter(this, "_ui", "devtools/client/debugger/src/actions/ui");

var ui = _interopRequireWildcard(_ui);

loader.lazyRequireGetter(this, "_fileSearch", "devtools/client/debugger/src/actions/file-search");

var fileSearch = _interopRequireWildcard(_fileSearch);

loader.lazyRequireGetter(this, "_projectTextSearch", "devtools/client/debugger/src/actions/project-text-search");

var projectTextSearch = _interopRequireWildcard(_projectTextSearch);

loader.lazyRequireGetter(this, "_quickOpen", "devtools/client/debugger/src/actions/quick-open");

var quickOpen = _interopRequireWildcard(_quickOpen);

loader.lazyRequireGetter(this, "_sourceTree", "devtools/client/debugger/src/actions/source-tree");

var sourceTree = _interopRequireWildcard(_sourceTree);

loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/actions/sources/index");

var sources = _interopRequireWildcard(_sources);

loader.lazyRequireGetter(this, "_sourceActors", "devtools/client/debugger/src/actions/source-actors");

var sourcesActors = _interopRequireWildcard(_sourceActors);

loader.lazyRequireGetter(this, "_tabs", "devtools/client/debugger/src/actions/tabs");

var tabs = _interopRequireWildcard(_tabs);

loader.lazyRequireGetter(this, "_debuggee", "devtools/client/debugger/src/actions/debuggee");

var debuggee = _interopRequireWildcard(_debuggee);

loader.lazyRequireGetter(this, "_toolbox", "devtools/client/debugger/src/actions/toolbox");

var toolbox = _interopRequireWildcard(_toolbox);

loader.lazyRequireGetter(this, "_preview", "devtools/client/debugger/src/actions/preview");

var preview = _interopRequireWildcard(_preview);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.default = {
  ...ast,
  ...navigation,
  ...breakpoints,
  ...expressions,
  ...eventListeners,
  ...sources,
  ...sourcesActors,
  ...tabs,
  ...pause,
  ...ui,
  ...fileSearch,
  ...projectTextSearch,
  ...quickOpen,
  ...sourceTree,
  ...debuggee,
  ...toolbox,
  ...preview
}; /* This Source Code Form is subject to the terms of the Mozilla Public
    * License, v. 2.0. If a copy of the MPL was not distributed with this
    * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */