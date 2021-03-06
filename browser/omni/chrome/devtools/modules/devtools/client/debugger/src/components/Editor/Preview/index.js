"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _Popup = _interopRequireDefault(require("./Popup"));

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

var _actions = _interopRequireDefault(require("../../../actions/index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Preview extends _react.PureComponent {
  constructor(props) {
    super(props);

    _defineProperty(this, "target", null);

    _defineProperty(this, "onTokenEnter", ({
      target,
      tokenPos
    }) => {
      const {
        cx,
        editor,
        updatePreview
      } = this.props;

      if (cx.isPaused && !this.state.selecting) {
        updatePreview(cx, target, tokenPos, editor.codeMirror);
      }
    });

    _defineProperty(this, "onMouseUp", () => {
      if (this.props.cx.isPaused) {
        this.setState({
          selecting: false
        });
        return true;
      }
    });

    _defineProperty(this, "onMouseDown", () => {
      if (this.props.cx.isPaused) {
        this.setState({
          selecting: true
        });
        return true;
      }
    });

    _defineProperty(this, "onScroll", () => {
      if (this.props.cx.isPaused) {
        this.props.clearPreview(this.props.cx);
      }
    });

    this.state = {
      selecting: false
    };
  }

  componentDidMount() {
    this.updateListeners();
  }

  componentWillUnmount() {
    const {
      codeMirror
    } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();
    codeMirror.off("tokenenter", this.onTokenEnter);
    codeMirror.off("scroll", this.onScroll);
    codeMirrorWrapper.removeEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.removeEventListener("mousedown", this.onMouseDown);
  }

  updateListeners(prevProps) {
    const {
      codeMirror
    } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();
    codeMirror.on("tokenenter", this.onTokenEnter);
    codeMirror.on("scroll", this.onScroll);
    codeMirrorWrapper.addEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.addEventListener("mousedown", this.onMouseDown);
  }

  render() {
    const {
      preview
    } = this.props;

    if (!preview || this.state.selecting) {
      return null;
    }

    return _react.default.createElement(_Popup.default, {
      preview: preview,
      editor: this.props.editor,
      editorRef: this.props.editorRef
    });
  }

}

const mapStateToProps = state => ({
  cx: (0, _selectors.getThreadContext)(state),
  preview: (0, _selectors.getPreview)(state)
});

var _default = (0, _connect.connect)(mapStateToProps, {
  clearPreview: _actions.default.clearPreview,
  addExpression: _actions.default.addExpression,
  updatePreview: _actions.default.updatePreview
})(Preview);

exports.default = _default;