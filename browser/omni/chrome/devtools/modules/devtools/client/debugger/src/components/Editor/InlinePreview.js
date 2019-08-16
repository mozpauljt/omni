"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _devtoolsReps = require("devtools/client/shared/components/reps/reps.js");

var _devtoolsReps2 = _interopRequireDefault(_devtoolsReps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const {
  REPS: { Rep },
  MODE
} = _devtoolsReps2.default;

// Renders single variable preview inside a codemirror line widget
class InlinePreview extends _react.PureComponent {
  showInScopes(variable) {
    // TODO: focus on variable value in the scopes sidepanel
    // we will need more info from parent comp
  }

  render() {
    const { value, variable } = this.props;
    return _react2.default.createElement(
      "span",
      {
        className: "inline-preview-outer",
        onClick: () => this.showInScopes(variable)
      },
      _react2.default.createElement(
        "span",
        { className: "inline-preview-label" },
        variable
      ),
      _react2.default.createElement(
        "span",
        { className: "inline-preview-value" },
        _react2.default.createElement(Rep, { object: value, mode: MODE.SHORT, noGrip: true })
      )
    );
  }
}

exports.default = InlinePreview;