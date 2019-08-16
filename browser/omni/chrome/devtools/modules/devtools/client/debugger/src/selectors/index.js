"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getVisibleSelectedFrame = exports.getSelectedFrames = exports.getSelectedFrame = exports.shouldPauseOnAnyXHR = exports.getXHRBreakpoints = exports.isLineInScope = exports.getBreakpointSources = exports.getCallStackFrames = exports.isSelectedFrameVisible = exports.inComponent = exports.getFirstVisibleBreakpoints = exports.getVisibleBreakpoints = exports.getBreakpointsAtLine = exports.getBreakpointAtLocation = exports.getQuickOpenType = exports.getQuickOpenQuery = exports.getQuickOpenEnabled = exports.getSourceActorsForThread = exports.getSourceActors = exports.hasSourceActor = exports.getSourceActor = undefined;
loader.lazyRequireGetter(this, "_expressions", "devtools/client/debugger/src/reducers/expressions");
Object.keys(_expressions).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _expressions[key];
    }
  });
});
loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/reducers/sources");
Object.keys(_sources).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sources[key];
    }
  });
});
loader.lazyRequireGetter(this, "_tabs", "devtools/client/debugger/src/reducers/tabs");
Object.keys(_tabs).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _tabs[key];
    }
  });
});
loader.lazyRequireGetter(this, "_eventListeners", "devtools/client/debugger/src/reducers/event-listeners");
Object.keys(_eventListeners).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _eventListeners[key];
    }
  });
});
loader.lazyRequireGetter(this, "_pause", "devtools/client/debugger/src/reducers/pause");
Object.keys(_pause).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _pause[key];
    }
  });
});
loader.lazyRequireGetter(this, "_debuggee", "devtools/client/debugger/src/reducers/debuggee");
Object.keys(_debuggee).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _debuggee[key];
    }
  });
});
loader.lazyRequireGetter(this, "_breakpoints", "devtools/client/debugger/src/reducers/breakpoints");
Object.keys(_breakpoints).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _breakpoints[key];
    }
  });
});
loader.lazyRequireGetter(this, "_pendingBreakpoints", "devtools/client/debugger/src/reducers/pending-breakpoints");
Object.keys(_pendingBreakpoints).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _pendingBreakpoints[key];
    }
  });
});
loader.lazyRequireGetter(this, "_ui", "devtools/client/debugger/src/reducers/ui");
Object.keys(_ui).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _ui[key];
    }
  });
});
loader.lazyRequireGetter(this, "_fileSearch", "devtools/client/debugger/src/reducers/file-search");
Object.keys(_fileSearch).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _fileSearch[key];
    }
  });
});
loader.lazyRequireGetter(this, "_ast", "devtools/client/debugger/src/reducers/ast");
Object.keys(_ast).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _ast[key];
    }
  });
});
loader.lazyRequireGetter(this, "_projectTextSearch", "devtools/client/debugger/src/reducers/project-text-search");
Object.keys(_projectTextSearch).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _projectTextSearch[key];
    }
  });
});
loader.lazyRequireGetter(this, "_sourceTree", "devtools/client/debugger/src/reducers/source-tree");
Object.keys(_sourceTree).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sourceTree[key];
    }
  });
});
loader.lazyRequireGetter(this, "_preview", "devtools/client/debugger/src/reducers/preview");
Object.keys(_preview).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _preview[key];
    }
  });
});
loader.lazyRequireGetter(this, "_sourceActors", "devtools/client/debugger/src/reducers/source-actors");
Object.defineProperty(exports, "getSourceActor", {
  enumerable: true,
  get: function () {
    return _sourceActors.getSourceActor;
  }
});
Object.defineProperty(exports, "hasSourceActor", {
  enumerable: true,
  get: function () {
    return _sourceActors.hasSourceActor;
  }
});
Object.defineProperty(exports, "getSourceActors", {
  enumerable: true,
  get: function () {
    return _sourceActors.getSourceActors;
  }
});
Object.defineProperty(exports, "getSourceActorsForThread", {
  enumerable: true,
  get: function () {
    return _sourceActors.getSourceActorsForThread;
  }
});
loader.lazyRequireGetter(this, "_quickOpen", "devtools/client/debugger/src/reducers/quick-open");
Object.defineProperty(exports, "getQuickOpenEnabled", {
  enumerable: true,
  get: function () {
    return _quickOpen.getQuickOpenEnabled;
  }
});
Object.defineProperty(exports, "getQuickOpenQuery", {
  enumerable: true,
  get: function () {
    return _quickOpen.getQuickOpenQuery;
  }
});
Object.defineProperty(exports, "getQuickOpenType", {
  enumerable: true,
  get: function () {
    return _quickOpen.getQuickOpenType;
  }
});
loader.lazyRequireGetter(this, "_breakpointAtLocation", "devtools/client/debugger/src/selectors/breakpointAtLocation");
Object.defineProperty(exports, "getBreakpointAtLocation", {
  enumerable: true,
  get: function () {
    return _breakpointAtLocation.getBreakpointAtLocation;
  }
});
Object.defineProperty(exports, "getBreakpointsAtLine", {
  enumerable: true,
  get: function () {
    return _breakpointAtLocation.getBreakpointsAtLine;
  }
});
loader.lazyRequireGetter(this, "_visibleBreakpoints", "devtools/client/debugger/src/selectors/visibleBreakpoints");
Object.defineProperty(exports, "getVisibleBreakpoints", {
  enumerable: true,
  get: function () {
    return _visibleBreakpoints.getVisibleBreakpoints;
  }
});
Object.defineProperty(exports, "getFirstVisibleBreakpoints", {
  enumerable: true,
  get: function () {
    return _visibleBreakpoints.getFirstVisibleBreakpoints;
  }
});
loader.lazyRequireGetter(this, "_inComponent", "devtools/client/debugger/src/selectors/inComponent");
Object.defineProperty(exports, "inComponent", {
  enumerable: true,
  get: function () {
    return _inComponent.inComponent;
  }
});
loader.lazyRequireGetter(this, "_isSelectedFrameVisible", "devtools/client/debugger/src/selectors/isSelectedFrameVisible");
Object.defineProperty(exports, "isSelectedFrameVisible", {
  enumerable: true,
  get: function () {
    return _isSelectedFrameVisible.isSelectedFrameVisible;
  }
});
loader.lazyRequireGetter(this, "_getCallStackFrames", "devtools/client/debugger/src/selectors/getCallStackFrames");
Object.defineProperty(exports, "getCallStackFrames", {
  enumerable: true,
  get: function () {
    return _getCallStackFrames.getCallStackFrames;
  }
});
loader.lazyRequireGetter(this, "_breakpointSources", "devtools/client/debugger/src/selectors/breakpointSources");
Object.defineProperty(exports, "getBreakpointSources", {
  enumerable: true,
  get: function () {
    return _breakpointSources.getBreakpointSources;
  }
});
loader.lazyRequireGetter(this, "_isLineInScope", "devtools/client/debugger/src/selectors/isLineInScope");
Object.defineProperty(exports, "isLineInScope", {
  enumerable: true,
  get: function () {
    return _isLineInScope.isLineInScope;
  }
});
loader.lazyRequireGetter(this, "_breakpoints2", "devtools/client/debugger/src/selectors/breakpoints");
Object.defineProperty(exports, "getXHRBreakpoints", {
  enumerable: true,
  get: function () {
    return _breakpoints2.getXHRBreakpoints;
  }
});
Object.defineProperty(exports, "shouldPauseOnAnyXHR", {
  enumerable: true,
  get: function () {
    return _breakpoints2.shouldPauseOnAnyXHR;
  }
});
loader.lazyRequireGetter(this, "_visibleColumnBreakpoints", "devtools/client/debugger/src/selectors/visibleColumnBreakpoints");
Object.keys(_visibleColumnBreakpoints).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _visibleColumnBreakpoints[key];
    }
  });
});
loader.lazyRequireGetter(this, "_pause2", "devtools/client/debugger/src/selectors/pause");
Object.defineProperty(exports, "getSelectedFrame", {
  enumerable: true,
  get: function () {
    return _pause2.getSelectedFrame;
  }
});
Object.defineProperty(exports, "getSelectedFrames", {
  enumerable: true,
  get: function () {
    return _pause2.getSelectedFrames;
  }
});
Object.defineProperty(exports, "getVisibleSelectedFrame", {
  enumerable: true,
  get: function () {
    return _pause2.getVisibleSelectedFrame;
  }
});

var _devtoolsReps = require("devtools/client/shared/components/reps/reps.js");

const { reducer } = _devtoolsReps.objectInspector;

// eslint-disable-next-line import/named


Object.keys(reducer).forEach(function (key) {
  if (key === "default" || key === "__esModule") {
    return;
  }
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: reducer[key]
  });
});