"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _InlinePreviewRow = _interopRequireDefault(require("./InlinePreviewRow"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
class InlinePreviews extends _react.Component {
  render() {
    const {
      editor,
      selectedFrame,
      selectedSource,
      previews,
      columnBreakpoints
    } = this.props; // Render only if currently open file is the one where debugger is paused

    if (!selectedFrame || selectedFrame.location.sourceId !== selectedSource.id || !previews) {
      return null;
    }

    let inlinePreviewRows;
    editor.codeMirror.operation(() => {
      inlinePreviewRows = Object.keys(previews).map(line => {
        const lineNum = parseInt(line, 10);
        const numColumnBreakpoints = columnBreakpoints.filter(bp => bp.location.line === lineNum + 1).length;
        return _react.default.createElement(_InlinePreviewRow.default, {
          editor: editor,
          key: line,
          line: lineNum,
          previews: previews[line],
          numColumnBreakpoints: numColumnBreakpoints
        });
      });
    });
    return _react.default.createElement("div", null, inlinePreviewRows);
  }

}

const mapStateToProps = state => {
  const thread = (0, _selectors.getCurrentThread)(state);
  const selectedFrame = (0, _selectors.getSelectedFrame)(state, thread);
  if (!selectedFrame) return {};
  return {
    selectedFrame,
    previews: (0, _selectors.getInlinePreviews)(state, thread, selectedFrame.id),
    columnBreakpoints: (0, _selectors.visibleColumnBreakpoints)(state)
  };
};

var _default = (0, _connect.connect)(mapStateToProps)(InlinePreviews);

exports.default = _default;