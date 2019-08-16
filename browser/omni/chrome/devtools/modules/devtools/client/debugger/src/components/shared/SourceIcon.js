"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_AccessibleImage", "devtools/client/debugger/src/components/shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");
loader.lazyRequireGetter(this, "_tabs", "devtools/client/debugger/src/utils/tabs");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class SourceIcon extends _react.PureComponent {
  render() {
    const { shouldHide, source, symbols, framework } = this.props;
    const iconClass = framework ? framework.toLowerCase() : (0, _source.getSourceClassnames)(source, symbols);

    if (shouldHide && shouldHide(iconClass)) {
      return null;
    }

    return _react2.default.createElement(_AccessibleImage2.default, { className: `source-icon ${iconClass}` });
  }
}

exports.default = (0, _connect.connect)((state, props) => ({
  symbols: (0, _selectors.getSymbols)(state, props.source),
  framework: (0, _tabs.getFramework)((0, _selectors.getTabs)(state), props.source.url)
}))(SourceIcon);