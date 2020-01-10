"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _propTypes = _interopRequireDefault(require("devtools/client/shared/vendor/react-prop-types"));

var _lodash = require("devtools/client/shared/vendor/lodash");

loader.lazyRequireGetter(this, "_frames", "devtools/client/debugger/src/utils/pause/frames/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
class PreviewFunction extends _react.Component {
  renderFunctionName(func) {
    const {
      l10n
    } = this.context;
    const name = (0, _frames.formatDisplayName)(func, undefined, l10n);
    return _react.default.createElement("span", {
      className: "function-name"
    }, name);
  }

  renderParams(func) {
    const {
      parameterNames = []
    } = func;
    const params = parameterNames.filter(i => i).map(param => _react.default.createElement("span", {
      className: "param",
      key: param
    }, param));
    const commas = (0, _lodash.times)(params.length - 1).map((_, i) => _react.default.createElement("span", {
      className: "delimiter",
      key: i
    }, ", ")); // $FlowIgnore

    return (0, _lodash.flatten)((0, _lodash.zip)(params, commas));
  }

  render() {
    const {
      func
    } = this.props;
    return _react.default.createElement("span", {
      className: "function-signature"
    }, this.renderFunctionName(func), _react.default.createElement("span", {
      className: "paren"
    }, "("), this.renderParams(func), _react.default.createElement("span", {
      className: "paren"
    }, ")"));
  }

}

exports.default = PreviewFunction;
PreviewFunction.contextTypes = {
  l10n: _propTypes.default.object
};