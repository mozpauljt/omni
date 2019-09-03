"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

loader.lazyRequireGetter(this, "_CommandBarButton", "devtools/client/debugger/src/components/shared/Button/CommandBarButton");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
class UtilsBar extends _react.Component {
  renderUtilButtons() {
    return [(0, _CommandBarButton.debugBtn)(this.props.toggleShortcutsModal, "shortcuts", "active", L10N.getStr("shortcuts.buttonName"), false)];
  }

  render() {
    return _react.default.createElement("div", {
      className: (0, _classnames.default)("command-bar command-bar-bottom", {
        vertical: !this.props.horizontal
      })
    }, this.renderUtilButtons());
  }

}

var _default = UtilsBar;
exports.default = _default;