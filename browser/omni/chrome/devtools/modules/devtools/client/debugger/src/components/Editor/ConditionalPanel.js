"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ConditionalPanel = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _reactDom = _interopRequireDefault(require("devtools/client/shared/vendor/react-dom"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

loader.lazyRequireGetter(this, "_editor", "devtools/client/debugger/src/utils/editor/index");

var _actions = _interopRequireDefault(require("../../actions/index"));

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function addNewLine(doc) {
  const cursor = doc.getCursor();
  const pos = {
    line: cursor.line,
    ch: cursor.ch
  };
  doc.replaceRange("\n", pos);
}

class ConditionalPanel extends _react.PureComponent {
  constructor() {
    super();

    _defineProperty(this, "saveAndClose", () => {
      if (this.input) {
        this.setBreakpoint(this.input.value.trim());
      }

      this.props.closeConditionalPanel();
    });

    _defineProperty(this, "onKey", e => {
      if (e.key === "Enter") {
        if (this.codeMirror && e.altKey) {
          addNewLine(this.codeMirror.doc);
        } else {
          this.saveAndClose();
        }
      } else if (e.key === "Escape") {
        this.props.closeConditionalPanel();
      }
    });

    _defineProperty(this, "repositionOnScroll", () => {
      if (this.panelNode && this.scrollParent) {
        const {
          scrollLeft
        } = this.scrollParent;
        this.panelNode.style.transform = `translateX(${scrollLeft}px)`;
      }
    });

    _defineProperty(this, "createEditor", input => {
      const {
        log,
        editor,
        closeConditionalPanel
      } = this.props;
      const codeMirror = editor.CodeMirror.fromTextArea(input, {
        mode: "javascript",
        theme: "mozilla",
        placeholder: L10N.getStr(log ? "editor.conditionalPanel.logPoint.placeholder2" : "editor.conditionalPanel.placeholder2")
      });
      codeMirror.on("keydown", (cm, e) => {
        if (e.key === "Enter") {
          e.codemirrorIgnore = true;
        }
      });
      codeMirror.on("blur", (cm, e) => closeConditionalPanel());
      const codeMirrorWrapper = codeMirror.getWrapperElement();
      codeMirrorWrapper.addEventListener("keydown", e => {
        codeMirror.save();
        this.onKey(e);
      });
      this.input = input;
      this.codeMirror = codeMirror;
      codeMirror.focus();
      codeMirror.setCursor(codeMirror.lineCount(), 0);
    });

    this.cbPanel = null;
  }

  keepFocusOnInput() {
    if (this.input) {
      this.input.focus();
    }
  }

  setBreakpoint(value) {
    const {
      cx,
      location,
      log,
      breakpoint
    } = this.props;
    const options = breakpoint ? breakpoint.options : {};
    const type = log ? "logValue" : "condition";
    return this.props.setBreakpointOptions(cx, location, { ...options,
      [type]: value
    });
  }

  clearConditionalPanel() {
    if (this.cbPanel) {
      this.cbPanel.clear();
      this.cbPanel = null;
    }

    if (this.scrollParent) {
      this.scrollParent.removeEventListener("scroll", this.repositionOnScroll);
    }
  }

  componentWillMount() {
    return this.renderToWidget(this.props);
  }

  componentWillUpdate() {
    return this.clearConditionalPanel();
  }

  componentDidUpdate(prevProps) {
    this.keepFocusOnInput();
  }

  componentWillUnmount() {
    // This is called if CodeMirror is re-initializing itself before the
    // user closes the conditional panel. Clear the widget, and re-render it
    // as soon as this component gets remounted
    return this.clearConditionalPanel();
  }

  renderToWidget(props) {
    if (this.cbPanel) {
      this.clearConditionalPanel();
    }

    const {
      location,
      editor
    } = props;
    const editorLine = (0, _editor.toEditorLine)(location.sourceId, location.line || 0);
    this.cbPanel = editor.codeMirror.addLineWidget(editorLine, this.renderConditionalPanel(props), {
      coverGutter: true,
      noHScroll: true
    });

    if (this.input) {
      let parent = this.input.parentNode;

      while (parent) {
        if (parent instanceof HTMLElement && parent.classList.contains("CodeMirror-scroll")) {
          this.scrollParent = parent;
          break;
        }

        parent = parent.parentNode;
      }

      if (this.scrollParent) {
        this.scrollParent.addEventListener("scroll", this.repositionOnScroll);
        this.repositionOnScroll();
      }
    }
  }

  getDefaultValue() {
    const {
      breakpoint,
      log
    } = this.props;
    const options = breakpoint && breakpoint.options || {};
    return log ? options.logValue : options.condition;
  }

  renderConditionalPanel(props) {
    const {
      log
    } = props;
    const defaultValue = this.getDefaultValue();
    const panel = document.createElement("div");

    _reactDom.default.render(_react.default.createElement("div", {
      className: (0, _classnames.default)("conditional-breakpoint-panel", {
        "log-point": log
      }),
      onClick: () => this.keepFocusOnInput(),
      ref: node => this.panelNode = node
    }, _react.default.createElement("div", {
      className: "prompt"
    }, "\xBB"), _react.default.createElement("textarea", {
      defaultValue: defaultValue,
      ref: input => this.createEditor(input)
    })), panel);

    return panel;
  }

  render() {
    return null;
  }

}

exports.ConditionalPanel = ConditionalPanel;

const mapStateToProps = state => {
  const location = (0, _selectors.getConditionalPanelLocation)(state);
  return {
    cx: (0, _selectors.getContext)(state),
    breakpoint: (0, _selectors.getBreakpoint)(state, location),
    location,
    log: (0, _selectors.getLogPointStatus)(state)
  };
};

const {
  setBreakpointOptions,
  openConditionalPanel,
  closeConditionalPanel
} = _actions.default;
const mapDispatchToProps = {
  setBreakpointOptions,
  openConditionalPanel,
  closeConditionalPanel
};

var _default = (0, _connect.connect)(mapStateToProps, mapDispatchToProps)(ConditionalPanel);

exports.default = _default;