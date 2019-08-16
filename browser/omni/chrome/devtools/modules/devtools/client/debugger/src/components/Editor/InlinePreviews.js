"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_InlinePreviewRow", "devtools/client/debugger/src/components/Editor/InlinePreviewRow");

var _InlinePreviewRow2 = _interopRequireDefault(_InlinePreviewRow);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class InlinePreviews extends _react.Component {
  render() {
    const { editor, selectedFrame, selectedSource, previews } = this.props;

    // Render only if currently open file is the one where debugger is paused
    if (!selectedFrame || selectedFrame.location.sourceId !== selectedSource.id || !previews) {
      return null;
    }

    return _react2.default.createElement(
      "div",
      null,
      Object.keys(previews).map(line => {
        return _react2.default.createElement(_InlinePreviewRow2.default, {
          editor: editor,
          line: parseInt(line, 10),
          previews: previews[line]
        });
      })
    );
  }
}

const mapStateToProps = state => {
  const thread = (0, _selectors.getCurrentThread)(state);
  const selectedFrame = (0, _selectors.getSelectedFrame)(state, thread);

  if (!selectedFrame) return {};

  return {
    selectedFrame,
    previews: (0, _selectors.getInlinePreviews)(state, thread, selectedFrame.id)
  };
};

exports.default = (0, _connect.connect)(mapStateToProps)(InlinePreviews);