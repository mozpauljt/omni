"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PaneToggleButton = exports.debugBtn = exports.CommandBarButton = exports.CloseButton = undefined;
loader.lazyRequireGetter(this, "_CloseButton", "devtools/client/debugger/src/components/shared/Button/CloseButton");

var _CloseButton2 = _interopRequireDefault(_CloseButton);

loader.lazyRequireGetter(this, "_CommandBarButton", "devtools/client/debugger/src/components/shared/Button/CommandBarButton");

var _CommandBarButton2 = _interopRequireDefault(_CommandBarButton);

loader.lazyRequireGetter(this, "_PaneToggleButton", "devtools/client/debugger/src/components/shared/Button/PaneToggleButton");

var _PaneToggleButton2 = _interopRequireDefault(_PaneToggleButton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.CloseButton = _CloseButton2.default;
exports.CommandBarButton = _CommandBarButton2.default;
exports.debugBtn = _CommandBarButton.debugBtn;
exports.PaneToggleButton = _PaneToggleButton2.default; /* This Source Code Form is subject to the terms of the Mozilla Public
                                                        * License, v. 2.0. If a copy of the MPL was not distributed with this
                                                        * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */