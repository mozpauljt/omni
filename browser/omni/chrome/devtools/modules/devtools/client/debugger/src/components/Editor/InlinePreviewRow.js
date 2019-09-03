"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _reactDom = _interopRequireDefault(require("devtools/client/shared/vendor/react-dom"));

var _actions = _interopRequireDefault(require("../../actions/index"));

var _assert = _interopRequireDefault(require("../../utils/assert"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _InlinePreview = _interopRequireDefault(require("./InlinePreview"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
// Handles rendering for each line ( row )
// * Renders single widget for each line in codemirror
// * Renders InlinePreview for each preview inside the widget
class InlinePreviewRow extends _react.PureComponent {
  componentDidMount() {
    this.updatePreviewWidget(this.props, null);
  }

  componentDidUpdate(prevProps) {
    this.updatePreviewWidget(this.props, prevProps);
  }

  componentWillUnmount() {
    this.updatePreviewWidget(null, this.props);
  }

  getPreviewPosition(editor, line) {
    const lineStartPos = editor.codeMirror.cursorCoords({
      line,
      ch: 0
    });
    const lineEndPos = editor.codeMirror.cursorCoords({
      line,
      ch: editor.getLine(line).length
    });
    const previewSpacing = 8;
    return lineEndPos.left - lineStartPos.left + previewSpacing;
  }

  updatePreviewWidget(props, prevProps) {
    if (this.IPWidget && prevProps && (!props || prevProps.editor !== props.editor || prevProps.line !== props.line)) {
      this.IPWidget.clear();
      this.IPWidget = null;
    }

    if (!props) {
      return (0, _assert.default)(!this.IPWidget, "Inline Preview widget shouldn't be present.");
    }

    const {
      editor,
      line,
      previews,
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement
    } = props;

    if (!this.IPWidget) {
      const widget = document.createElement("div");
      widget.classList.add("inline-preview");
      this.IPWidget = editor.codeMirror.addLineWidget(line, widget);
    }

    const left = this.getPreviewPosition(editor, line);

    if (!prevProps || this.lastLeft !== left) {
      this.lastLeft = left;
      this.IPWidget.node.style.left = `${left}px`;
    }

    _reactDom.default.render(_react.default.createElement(_react.default.Fragment, null, previews.map(preview => _react.default.createElement(_InlinePreview.default, {
      line: line,
      variable: preview.name,
      value: preview.value,
      openElementInInspector: openElementInInspector,
      highlightDomElement: highlightDomElement,
      unHighlightDomElement: unHighlightDomElement
    }))), this.IPWidget.node);
  }

  render() {
    return null;
  }

}

var _default = (0, _connect.connect)(() => ({}), {
  openElementInInspector: _actions.default.openElementInInspectorCommand,
  highlightDomElement: _actions.default.highlightDomElement,
  unHighlightDomElement: _actions.default.unHighlightDomElement
})(InlinePreviewRow);

exports.default = _default;