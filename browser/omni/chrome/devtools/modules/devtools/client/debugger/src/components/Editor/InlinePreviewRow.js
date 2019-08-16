"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("devtools/client/shared/vendor/react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

loader.lazyRequireGetter(this, "_assert", "devtools/client/debugger/src/utils/assert");

var _assert2 = _interopRequireDefault(_assert);

loader.lazyRequireGetter(this, "_InlinePreview", "devtools/client/debugger/src/components/Editor/InlinePreview");

var _InlinePreview2 = _interopRequireDefault(_InlinePreview);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Handles rendering for each line ( row )
// * Renders single widget for each line in codemirror
// * Renders InlinePreview for each preview inside the widget
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

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

  updatePreviewWidget(props, prevProps) {
    if (this.IPWidget && prevProps && (!props || prevProps.editor !== props.editor || prevProps.line !== props.line)) {
      this.IPWidget.clear();
      this.IPWidget = null;
    }

    if (!props) {
      return (0, _assert2.default)(!this.IPWidget, "Inline Preview widget shouldn't be present.");
    }

    const { editor, line, previews } = props;

    if (!this.IPWidget) {
      const widget = document.createElement("div");
      widget.classList.add("inline-preview");
      this.IPWidget = editor.codeMirror.addLineWidget(line, widget);
    }

    // Determine the end of line and append preview after leaving gap of 8px
    const left = editor.getLine(line).length * editor.defaultCharWidth() + 8;
    if (!prevProps || this.lastLeft !== left) {
      this.lastLeft = left;
      this.IPWidget.node.style.left = `${left}px`;
    }

    _reactDom2.default.render(_react2.default.createElement(
      _react2.default.Fragment,
      null,
      previews.map(preview => _react2.default.createElement(_InlinePreview2.default, {
        line: line,
        variable: preview.name,
        value: preview.value
      }))
    ), this.IPWidget.node);
  }

  render() {
    return null;
  }
}

exports.default = InlinePreviewRow;