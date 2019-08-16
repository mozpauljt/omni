"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_Popup", "devtools/client/debugger/src/components/Editor/Preview/Popup");

var _Popup2 = _interopRequireDefault(_Popup);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Preview extends _react.PureComponent {
  constructor(props) {
    super(props);
    this.target = null;

    this.onTokenEnter = ({ target, tokenPos }) => {
      const { cx, editor, updatePreview } = this.props;

      if (cx.isPaused && !this.state.selecting) {
        updatePreview(cx, target, tokenPos, editor.codeMirror);
      }
    };

    this.onMouseUp = () => {
      if (this.props.cx.isPaused) {
        this.setState({ selecting: false });
        return true;
      }
    };

    this.onMouseDown = () => {
      if (this.props.cx.isPaused) {
        this.setState({ selecting: true });
        return true;
      }
    };

    this.onScroll = () => {
      if (this.props.cx.isPaused) {
        this.props.clearPreview(this.props.cx);
      }
    };

    this.state = { selecting: false };
  }

  componentDidMount() {
    this.updateListeners();
  }

  componentWillUnmount() {
    const { codeMirror } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();

    codeMirror.off("tokenenter", this.onTokenEnter);
    codeMirror.off("scroll", this.onScroll);
    codeMirrorWrapper.removeEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.removeEventListener("mousedown", this.onMouseDown);
  }

  updateListeners(prevProps) {
    const { codeMirror } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();
    codeMirror.on("tokenenter", this.onTokenEnter);
    codeMirror.on("scroll", this.onScroll);
    codeMirrorWrapper.addEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.addEventListener("mousedown", this.onMouseDown);
  }

  render() {
    const { preview } = this.props;
    if (!preview || this.state.selecting) {
      return null;
    }

    return _react2.default.createElement(_Popup2.default, {
      preview: preview,
      editor: this.props.editor,
      editorRef: this.props.editorRef
    });
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const mapStateToProps = state => ({
  cx: (0, _selectors.getThreadContext)(state),
  preview: (0, _selectors.getPreview)(state)
});

exports.default = (0, _connect.connect)(mapStateToProps, {
  clearPreview: _actions2.default.clearPreview,
  addExpression: _actions2.default.addExpression,
  updatePreview: _actions2.default.updatePreview
})(Preview);