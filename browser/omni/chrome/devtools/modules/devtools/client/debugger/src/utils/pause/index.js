"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
loader.lazyRequireGetter(this, "_why", "devtools/client/debugger/src/utils/pause/why");
Object.keys(_why).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _why[key];
    }
  });
});
loader.lazyRequireGetter(this, "_inlinePreview", "devtools/client/debugger/src/utils/pause/inlinePreview");
Object.keys(_inlinePreview).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _inlinePreview[key];
    }
  });
});