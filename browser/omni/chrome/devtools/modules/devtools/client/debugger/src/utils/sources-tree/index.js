"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
loader.lazyRequireGetter(this, "_addToTree", "devtools/client/debugger/src/utils/sources-tree/addToTree");
Object.defineProperty(exports, "addToTree", {
  enumerable: true,
  get: function () {
    return _addToTree.addToTree;
  }
});
loader.lazyRequireGetter(this, "_collapseTree", "devtools/client/debugger/src/utils/sources-tree/collapseTree");
Object.defineProperty(exports, "collapseTree", {
  enumerable: true,
  get: function () {
    return _collapseTree.collapseTree;
  }
});
loader.lazyRequireGetter(this, "_formatTree", "devtools/client/debugger/src/utils/sources-tree/formatTree");
Object.defineProperty(exports, "formatTree", {
  enumerable: true,
  get: function () {
    return _formatTree.formatTree;
  }
});
loader.lazyRequireGetter(this, "_getDirectories", "devtools/client/debugger/src/utils/sources-tree/getDirectories");
Object.defineProperty(exports, "getDirectories", {
  enumerable: true,
  get: function () {
    return _getDirectories.getDirectories;
  }
});
Object.defineProperty(exports, "findSourceTreeNodes", {
  enumerable: true,
  get: function () {
    return _getDirectories.findSourceTreeNodes;
  }
});
loader.lazyRequireGetter(this, "_getURL", "devtools/client/debugger/src/utils/sources-tree/getURL");
Object.defineProperty(exports, "getFilenameFromPath", {
  enumerable: true,
  get: function () {
    return _getURL.getFilenameFromPath;
  }
});
Object.defineProperty(exports, "getURL", {
  enumerable: true,
  get: function () {
    return _getURL.getURL;
  }
});
loader.lazyRequireGetter(this, "_sortTree", "devtools/client/debugger/src/utils/sources-tree/sortTree");
Object.defineProperty(exports, "sortTree", {
  enumerable: true,
  get: function () {
    return _sortTree.sortTree;
  }
});
loader.lazyRequireGetter(this, "_updateTree", "devtools/client/debugger/src/utils/sources-tree/updateTree");
Object.defineProperty(exports, "createTree", {
  enumerable: true,
  get: function () {
    return _updateTree.createTree;
  }
});
Object.defineProperty(exports, "updateTree", {
  enumerable: true,
  get: function () {
    return _updateTree.updateTree;
  }
});
loader.lazyRequireGetter(this, "_utils", "devtools/client/debugger/src/utils/sources-tree/utils");
Object.keys(_utils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _utils[key];
    }
  });
});