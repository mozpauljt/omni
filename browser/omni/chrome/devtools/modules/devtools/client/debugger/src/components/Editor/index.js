"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _propTypes = _interopRequireDefault(require("devtools/client/shared/vendor/react-prop-types"));

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _redux = require("devtools/client/shared/vendor/redux");

var _reactDom = _interopRequireDefault(require("devtools/client/shared/vendor/react-dom"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

var _lodash = require("devtools/client/shared/vendor/lodash");

var _devtoolsEnvironment = require("devtools/client/debugger/dist/vendors").vendored["devtools-environment"];

loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
loader.lazyRequireGetter(this, "_indentation", "devtools/client/debugger/src/utils/indentation");

var _devtoolsContextmenu = require("devtools/client/debugger/dist/vendors").vendored["devtools-contextmenu"];

loader.lazyRequireGetter(this, "_breakpoints", "devtools/client/debugger/src/components/Editor/menus/breakpoints");
loader.lazyRequireGetter(this, "_editor", "devtools/client/debugger/src/components/Editor/menus/editor");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

var _actions = _interopRequireDefault(require("../../actions/index"));

var _SearchBar = _interopRequireDefault(require("./SearchBar"));

var _HighlightLines = _interopRequireDefault(require("./HighlightLines"));

var _Preview = _interopRequireDefault(require("./Preview/index"));

var _Breakpoints = _interopRequireDefault(require("./Breakpoints"));

var _ColumnBreakpoints = _interopRequireDefault(require("./ColumnBreakpoints"));

var _DebugLine = _interopRequireDefault(require("./DebugLine"));

var _HighlightLine = _interopRequireDefault(require("./HighlightLine"));

var _EmptyLines = _interopRequireDefault(require("./EmptyLines"));

var _EditorMenu = _interopRequireDefault(require("./EditorMenu"));

var _ConditionalPanel = _interopRequireDefault(require("./ConditionalPanel"));

var _InlinePreviews = _interopRequireDefault(require("./InlinePreviews"));

loader.lazyRequireGetter(this, "_editor2", "devtools/client/debugger/src/utils/editor/index");
loader.lazyRequireGetter(this, "_ui", "devtools/client/debugger/src/utils/ui");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const cssVars = {
  searchbarHeight: "var(--editor-searchbar-height)"
};

class Editor extends _react.PureComponent {
  constructor(props) {
    super(props);

    _defineProperty(this, "onClosePress", (key, e) => {
      const {
        cx,
        selectedSource
      } = this.props;

      if (selectedSource) {
        e.preventDefault();
        e.stopPropagation();
        this.props.closeTab(cx, selectedSource);
      }
    });

    _defineProperty(this, "onToggleBreakpoint", (key, e) => {
      e.preventDefault();
      e.stopPropagation();
      const line = this.getCurrentLine();

      if (typeof line !== "number") {
        return;
      }

      this.props.toggleBreakpointAtLine(this.props.cx, line);
    });

    _defineProperty(this, "onToggleConditionalPanel", (key, e) => {
      e.stopPropagation();
      e.preventDefault();
      const line = this.getCurrentLine();

      if (typeof line !== "number") {
        return;
      }

      const isLog = key === L10N.getStr("toggleCondPanel.logPoint.key");
      this.toggleConditionalPanel(line, isLog);
    });

    _defineProperty(this, "onEditorScroll", (0, _lodash.debounce)(this.props.updateViewport, 75));

    _defineProperty(this, "onEscape", (key, e) => {
      if (!this.state.editor) {
        return;
      }

      const {
        codeMirror
      } = this.state.editor;

      if (codeMirror.listSelections().length > 1) {
        codeMirror.execCommand("singleSelection");
        e.preventDefault();
      }
    });

    _defineProperty(this, "clearContextMenu", () => {
      this.setState({
        contextMenu: null
      });
    });

    _defineProperty(this, "onGutterClick", (cm, line, gutter, ev) => {
      const {
        cx,
        selectedSource,
        conditionalPanelLocation,
        closeConditionalPanel,
        addBreakpointAtLine,
        continueToHere,
        toggleBlackBox
      } = this.props; // ignore right clicks in the gutter

      if (ev.ctrlKey && ev.button === 0 || ev.button === 2 || !selectedSource) {
        return;
      } // if user clicks gutter to set breakpoint on blackboxed source, un-blackbox the source.


      if (selectedSource && selectedSource.isBlackBoxed) {
        toggleBlackBox(cx, selectedSource);
      }

      if (conditionalPanelLocation) {
        return closeConditionalPanel();
      }

      if (gutter === "CodeMirror-foldgutter") {
        return;
      }

      const sourceLine = (0, _editor2.toSourceLine)(selectedSource.id, line);

      if (typeof sourceLine !== "number") {
        return;
      }

      if (ev.metaKey) {
        return continueToHere(cx, sourceLine);
      }

      return addBreakpointAtLine(cx, sourceLine, ev.altKey, ev.shiftKey);
    });

    _defineProperty(this, "onGutterContextMenu", event => {
      return this.openMenu(event);
    });

    _defineProperty(this, "toggleConditionalPanel", (line, log = false) => {
      const {
        conditionalPanelLocation,
        closeConditionalPanel,
        openConditionalPanel,
        selectedSource
      } = this.props;

      if (conditionalPanelLocation) {
        return closeConditionalPanel();
      }

      if (!selectedSource) {
        return;
      }

      return openConditionalPanel({
        line: line,
        sourceId: selectedSource.id,
        sourceUrl: selectedSource.url
      }, log);
    });

    this.state = {
      highlightedLineRange: null,
      editor: null,
      contextMenu: null
    };
  }

  componentWillReceiveProps(nextProps) {
    let editor = this.state.editor;

    if (!this.state.editor && nextProps.selectedSource) {
      editor = this.setupEditor();
    }

    (0, _editor2.startOperation)();
    this.setText(nextProps, editor);
    this.setSize(nextProps, editor);
    this.scrollToLocation(nextProps, editor);
    (0, _editor2.endOperation)();

    if (this.props.selectedSource != nextProps.selectedSource) {
      this.props.updateViewport();
      (0, _ui.resizeBreakpointGutter)(editor.codeMirror);
      (0, _ui.resizeToggleButton)(editor.codeMirror);
    }
  }

  setupEditor() {
    const editor = (0, _editor2.getEditor)(); // disables the default search shortcuts
    // $FlowIgnore

    editor._initShortcuts = () => {};

    const node = _reactDom.default.findDOMNode(this);

    if (node instanceof HTMLElement) {
      editor.appendToLocalElement(node.querySelector(".editor-mount"));
    }

    const {
      codeMirror
    } = editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();
    codeMirror.on("gutterClick", this.onGutterClick); // Set code editor wrapper to be focusable

    codeMirrorWrapper.tabIndex = 0;
    codeMirrorWrapper.addEventListener("keydown", e => this.onKeyDown(e));
    codeMirrorWrapper.addEventListener("click", e => this.onClick(e));
    codeMirrorWrapper.addEventListener("mouseover", (0, _editor2.onMouseOver)(codeMirror));

    const toggleFoldMarkerVisibility = e => {
      if (node instanceof HTMLElement) {
        node.querySelectorAll(".CodeMirror-guttermarker-subtle").forEach(elem => {
          elem.classList.toggle("visible");
        });
      }
    };

    const codeMirrorGutter = codeMirror.getGutterElement();
    codeMirrorGutter.addEventListener("mouseleave", toggleFoldMarkerVisibility);
    codeMirrorGutter.addEventListener("mouseenter", toggleFoldMarkerVisibility);

    if (!(0, _devtoolsEnvironment.isFirefox)()) {
      codeMirror.on("gutterContextMenu", (cm, line, eventName, event) => this.onGutterContextMenu(event));
      codeMirror.on("contextmenu", (cm, event) => this.openMenu(event));
    } else {
      codeMirrorWrapper.addEventListener("contextmenu", event => this.openMenu(event));
    }

    codeMirror.on("scroll", this.onEditorScroll);
    this.onEditorScroll();
    this.setState({
      editor
    });
    return editor;
  }

  componentDidMount() {
    const {
      shortcuts
    } = this.context;
    shortcuts.on(L10N.getStr("toggleBreakpoint.key"), this.onToggleBreakpoint);
    shortcuts.on(L10N.getStr("toggleCondPanel.breakpoint.key"), this.onToggleConditionalPanel);
    shortcuts.on(L10N.getStr("toggleCondPanel.logPoint.key"), this.onToggleConditionalPanel);
    shortcuts.on(L10N.getStr("sourceTabs.closeTab.key"), this.onClosePress);
    shortcuts.on("Esc", this.onEscape);
  }

  componentWillUnmount() {
    if (this.state.editor) {
      this.state.editor.destroy();
      this.state.editor.codeMirror.off("scroll", this.onEditorScroll);
      this.setState({
        editor: null
      });
    }

    const shortcuts = this.context.shortcuts;
    shortcuts.off(L10N.getStr("sourceTabs.closeTab.key"));
    shortcuts.off(L10N.getStr("toggleBreakpoint.key"));
    shortcuts.off(L10N.getStr("toggleCondPanel.breakpoint.key"));
    shortcuts.off(L10N.getStr("toggleCondPanel.logPoint.key"));
  }

  getCurrentLine() {
    const {
      codeMirror
    } = this.state.editor;
    const {
      selectedSource
    } = this.props;

    if (!selectedSource) {
      return;
    }

    const line = (0, _editor2.getCursorLine)(codeMirror);
    return (0, _editor2.toSourceLine)(selectedSource.id, line);
  }

  onKeyDown(e) {
    const {
      codeMirror
    } = this.state.editor;
    const {
      key,
      target
    } = e;
    const codeWrapper = codeMirror.getWrapperElement();
    const textArea = codeWrapper.querySelector("textArea");

    if (key === "Escape" && target == textArea) {
      e.stopPropagation();
      e.preventDefault();
      codeWrapper.focus();
    } else if (key === "Enter" && target == codeWrapper) {
      e.preventDefault(); // Focus into editor's text area

      textArea.focus();
    }
  }
  /*
   * The default Esc command is overridden in the CodeMirror keymap to allow
   * the Esc keypress event to be catched by the toolbox and trigger the
   * split console. Restore it here, but preventDefault if and only if there
   * is a multiselection.
   */


  openMenu(event) {
    event.stopPropagation();
    event.preventDefault();
    const {
      cx,
      selectedSource,
      breakpointActions,
      editorActions,
      isPaused,
      conditionalPanelLocation,
      closeConditionalPanel
    } = this.props;
    const {
      editor
    } = this.state;

    if (!selectedSource || !editor) {
      return;
    } // only allow one conditionalPanel location.


    if (conditionalPanelLocation) {
      closeConditionalPanel();
    }

    const target = event.target;
    const {
      id: sourceId
    } = selectedSource;
    const line = (0, _editor2.lineAtHeight)(editor, sourceId, event);

    if (typeof line != "number") {
      return;
    }

    const location = {
      line,
      column: undefined,
      sourceId
    };

    if (target.classList.contains("CodeMirror-linenumber")) {
      return (0, _devtoolsContextmenu.showMenu)(event, [...(0, _breakpoints.createBreakpointItems)(cx, location, breakpointActions), {
        type: "separator"
      }, (0, _editor.continueToHereItem)(cx, location, isPaused, editorActions)]);
    }

    if (target.getAttribute("id") === "columnmarker") {
      return;
    }

    this.setState({
      contextMenu: event
    });
  }

  onClick(e) {
    const {
      cx,
      selectedSource,
      jumpToMappedLocation
    } = this.props;

    if (selectedSource && e.metaKey && e.altKey) {
      const sourceLocation = (0, _editor2.getSourceLocationFromMouseEvent)(this.state.editor, selectedSource, e);
      jumpToMappedLocation(cx, sourceLocation);
    }
  }

  shouldScrollToLocation(nextProps, editor) {
    const {
      selectedLocation,
      selectedSource
    } = this.props;

    if (!editor || !nextProps.selectedSource || !nextProps.selectedLocation || !nextProps.selectedLocation.line || !nextProps.selectedSource.content) {
      return false;
    }

    const isFirstLoad = (!selectedSource || !selectedSource.content) && nextProps.selectedSource.content;
    const locationChanged = selectedLocation !== nextProps.selectedLocation;
    const symbolsChanged = nextProps.symbols != this.props.symbols;
    return isFirstLoad || locationChanged || symbolsChanged;
  }

  scrollToLocation(nextProps, editor) {
    const {
      selectedLocation,
      selectedSource
    } = nextProps;

    if (selectedLocation && this.shouldScrollToLocation(nextProps, editor)) {
      let {
        line,
        column
      } = (0, _editor2.toEditorPosition)(selectedLocation);

      if (selectedSource && (0, _editor2.hasDocument)(selectedSource.id)) {
        const doc = (0, _editor2.getDocument)(selectedSource.id);
        const lineText = doc.getLine(line);
        column = Math.max(column, (0, _indentation.getIndentation)(lineText));
      }

      (0, _editor2.scrollToColumn)(editor.codeMirror, line, column);
    }
  }

  setSize(nextProps, editor) {
    if (!editor) {
      return;
    }

    if (nextProps.startPanelSize !== this.props.startPanelSize || nextProps.endPanelSize !== this.props.endPanelSize) {
      editor.codeMirror.setSize();
    }
  }

  setText(props, editor) {
    const {
      selectedSource,
      symbols
    } = props;

    if (!editor) {
      return;
    } // check if we previously had a selected source


    if (!selectedSource) {
      return this.clearEditor();
    }

    if (!selectedSource.content) {
      return (0, _editor2.showLoading)(editor);
    }

    if (selectedSource.content.state === "rejected") {
      let {
        value
      } = selectedSource.content;

      if (typeof value !== "string") {
        value = "Unexpected source error";
      }

      return this.showErrorMessage(value);
    }

    return (0, _editor2.showSourceText)(editor, selectedSource, selectedSource.content.value, symbols);
  }

  clearEditor() {
    const {
      editor
    } = this.state;

    if (!editor) {
      return;
    }

    (0, _editor2.clearEditor)(editor);
  }

  showErrorMessage(msg) {
    const {
      editor
    } = this.state;

    if (!editor) {
      return;
    }

    (0, _editor2.showErrorMessage)(editor, msg);
  }

  getInlineEditorStyles() {
    const {
      searchOn
    } = this.props;

    if (searchOn) {
      return {
        height: `calc(100% - ${cssVars.searchbarHeight})`
      };
    }

    return {
      height: "100%"
    };
  }

  renderItems() {
    const {
      cx,
      selectedSource,
      conditionalPanelLocation,
      isPaused,
      inlinePreviewEnabled
    } = this.props;
    const {
      editor,
      contextMenu
    } = this.state;

    if (!selectedSource || !editor || !(0, _editor2.getDocument)(selectedSource.id)) {
      return null;
    }

    return _react.default.createElement("div", null, _react.default.createElement(_DebugLine.default, {
      editor: editor
    }), _react.default.createElement(_HighlightLine.default, null), _react.default.createElement(_EmptyLines.default, {
      editor: editor
    }), _react.default.createElement(_Breakpoints.default, {
      editor: editor,
      cx: cx
    }), _react.default.createElement(_Preview.default, {
      editor: editor,
      editorRef: this.$editorWrapper
    }), _react.default.createElement(_HighlightLines.default, {
      editor: editor
    }), _react.default.createElement(_EditorMenu.default, {
      editor: editor,
      contextMenu: contextMenu,
      clearContextMenu: this.clearContextMenu,
      selectedSource: selectedSource
    }), conditionalPanelLocation ? _react.default.createElement(_ConditionalPanel.default, {
      editor: editor
    }) : null, _prefs.features.columnBreakpoints ? _react.default.createElement(_ColumnBreakpoints.default, {
      editor: editor
    }) : null, isPaused && inlinePreviewEnabled ? _react.default.createElement(_InlinePreviews.default, {
      editor: editor,
      selectedSource: selectedSource
    }) : null);
  }

  renderSearchBar() {
    const {
      editor
    } = this.state;

    if (!this.props.selectedSource) {
      return null;
    }

    return _react.default.createElement(_SearchBar.default, {
      editor: editor
    });
  }

  render() {
    const {
      selectedSource,
      skipPausing
    } = this.props;
    return _react.default.createElement("div", {
      className: (0, _classnames.default)("editor-wrapper", {
        blackboxed: selectedSource && selectedSource.isBlackBoxed,
        "skip-pausing": skipPausing
      }),
      ref: c => this.$editorWrapper = c
    }, _react.default.createElement("div", {
      className: "editor-mount devtools-monospace",
      style: this.getInlineEditorStyles()
    }), this.renderSearchBar(), this.renderItems());
  }

}

Editor.contextTypes = {
  shortcuts: _propTypes.default.object
};

const mapStateToProps = state => {
  const selectedSource = (0, _selectors.getSelectedSourceWithContent)(state);
  return {
    cx: (0, _selectors.getThreadContext)(state),
    selectedLocation: (0, _selectors.getSelectedLocation)(state),
    selectedSource,
    searchOn: (0, _selectors.getActiveSearch)(state) === "file",
    conditionalPanelLocation: (0, _selectors.getConditionalPanelLocation)(state),
    symbols: (0, _selectors.getSymbols)(state, selectedSource),
    isPaused: (0, _selectors.getIsPaused)(state, (0, _selectors.getCurrentThread)(state)),
    skipPausing: (0, _selectors.getSkipPausing)(state),
    inlinePreviewEnabled: (0, _selectors.getInlinePreview)(state)
  };
};

const mapDispatchToProps = dispatch => ({ ...(0, _redux.bindActionCreators)({
    openConditionalPanel: _actions.default.openConditionalPanel,
    closeConditionalPanel: _actions.default.closeConditionalPanel,
    continueToHere: _actions.default.continueToHere,
    toggleBreakpointAtLine: _actions.default.toggleBreakpointAtLine,
    addBreakpointAtLine: _actions.default.addBreakpointAtLine,
    jumpToMappedLocation: _actions.default.jumpToMappedLocation,
    traverseResults: _actions.default.traverseResults,
    updateViewport: _actions.default.updateViewport,
    closeTab: _actions.default.closeTab,
    toggleBlackBox: _actions.default.toggleBlackBox
  }, dispatch),
  breakpointActions: (0, _breakpoints.breakpointItemActions)(dispatch),
  editorActions: (0, _editor.editorItemActions)(dispatch)
});

var _default = (0, _connect.connect)(mapStateToProps, mapDispatchToProps)(Editor);

exports.default = _default;