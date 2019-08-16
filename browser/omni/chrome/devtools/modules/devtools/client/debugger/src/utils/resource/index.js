"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
loader.lazyRequireGetter(this, "_core", "devtools/client/debugger/src/utils/resource/core");
Object.defineProperty(exports, "createInitial", {
  enumerable: true,
  get: function () {
    return _core.createInitial;
  }
});
Object.defineProperty(exports, "insertResources", {
  enumerable: true,
  get: function () {
    return _core.insertResources;
  }
});
Object.defineProperty(exports, "removeResources", {
  enumerable: true,
  get: function () {
    return _core.removeResources;
  }
});
Object.defineProperty(exports, "updateResources", {
  enumerable: true,
  get: function () {
    return _core.updateResources;
  }
});
loader.lazyRequireGetter(this, "_selector", "devtools/client/debugger/src/utils/resource/selector");
Object.defineProperty(exports, "hasResource", {
  enumerable: true,
  get: function () {
    return _selector.hasResource;
  }
});
Object.defineProperty(exports, "getResourceIds", {
  enumerable: true,
  get: function () {
    return _selector.getResourceIds;
  }
});
Object.defineProperty(exports, "getResource", {
  enumerable: true,
  get: function () {
    return _selector.getResource;
  }
});
Object.defineProperty(exports, "getMappedResource", {
  enumerable: true,
  get: function () {
    return _selector.getMappedResource;
  }
});
loader.lazyRequireGetter(this, "_baseQuery", "devtools/client/debugger/src/utils/resource/base-query");
Object.defineProperty(exports, "makeResourceQuery", {
  enumerable: true,
  get: function () {
    return _baseQuery.makeResourceQuery;
  }
});
Object.defineProperty(exports, "makeMapWithArgs", {
  enumerable: true,
  get: function () {
    return _baseQuery.makeMapWithArgs;
  }
});
loader.lazyRequireGetter(this, "_query", "devtools/client/debugger/src/utils/resource/query");
Object.defineProperty(exports, "filterAllIds", {
  enumerable: true,
  get: function () {
    return _query.filterAllIds;
  }
});
Object.defineProperty(exports, "makeWeakQuery", {
  enumerable: true,
  get: function () {
    return _query.makeWeakQuery;
  }
});
Object.defineProperty(exports, "makeShallowQuery", {
  enumerable: true,
  get: function () {
    return _query.makeShallowQuery;
  }
});
Object.defineProperty(exports, "makeStrictQuery", {
  enumerable: true,
  get: function () {
    return _query.makeStrictQuery;
  }
});
Object.defineProperty(exports, "makeIdQuery", {
  enumerable: true,
  get: function () {
    return _query.makeIdQuery;
  }
});
Object.defineProperty(exports, "makeLoadQuery", {
  enumerable: true,
  get: function () {
    return _query.makeLoadQuery;
  }
});
Object.defineProperty(exports, "makeFilterQuery", {
  enumerable: true,
  get: function () {
    return _query.makeFilterQuery;
  }
});
Object.defineProperty(exports, "makeReduceQuery", {
  enumerable: true,
  get: function () {
    return _query.makeReduceQuery;
  }
});
Object.defineProperty(exports, "makeReduceAllQuery", {
  enumerable: true,
  get: function () {
    return _query.makeReduceAllQuery;
  }
});
loader.lazyRequireGetter(this, "_queryCache", "devtools/client/debugger/src/utils/resource/query-cache");
Object.defineProperty(exports, "queryCacheWeak", {
  enumerable: true,
  get: function () {
    return _queryCache.queryCacheWeak;
  }
});
Object.defineProperty(exports, "queryCacheShallow", {
  enumerable: true,
  get: function () {
    return _queryCache.queryCacheShallow;
  }
});
Object.defineProperty(exports, "queryCacheStrict", {
  enumerable: true,
  get: function () {
    return _queryCache.queryCacheStrict;
  }
});
loader.lazyRequireGetter(this, "_memoize", "devtools/client/debugger/src/utils/resource/memoize");
Object.defineProperty(exports, "memoizeResourceShallow", {
  enumerable: true,
  get: function () {
    return _memoize.memoizeResourceShallow;
  }
});