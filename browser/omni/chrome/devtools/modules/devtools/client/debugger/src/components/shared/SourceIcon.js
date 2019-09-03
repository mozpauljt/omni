"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _AccessibleImage = _interopRequireDefault(require("./AccessibleImage"));

loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");
loader.lazyRequireGetter(this, "_tabs", "devtools/client/debugger/src/utils/tabs");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
class SourceIcon extends _react.PureComponent {
  render() {
    const {
      shouldHide,
      source,
      symbols,
      framework
    } = this.props;
    const iconClass = framework ? framework.toLowerCase() : (0, _source.getSourceClassnames)(source, symbols);

    if (shouldHide && shouldHide(iconClass)) {
      return null;
    }

    return _react.default.createElement(_AccessibleImage.default, {
      className: `source-icon ${iconClass}`
    });
  }

}

var _default = (0, _connect.connect)((state, props) => ({
  symbols: (0, _selectors.getSymbols)(state, props.source),
  framework: (0, _tabs.getFramework)((0, _selectors.getTabs)(state), props.source.url)
}))(SourceIcon);

exports.default = _default;