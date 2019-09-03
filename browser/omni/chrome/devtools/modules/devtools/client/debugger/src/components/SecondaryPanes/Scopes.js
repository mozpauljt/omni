"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _actions = _interopRequireDefault(require("../../actions/index"));

loader.lazyRequireGetter(this, "_firefox", "devtools/client/debugger/src/client/firefox");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_scopes", "devtools/client/debugger/src/utils/pause/scopes/index");
loader.lazyRequireGetter(this, "_utils", "devtools/client/debugger/src/utils/pause/scopes/utils");

var _devtoolsReps = require("devtools/client/shared/components/reps/reps.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  ObjectInspector
} = _devtoolsReps.objectInspector;

class Scopes extends _react.PureComponent {
  constructor(props, ...args) {
    const {
      why,
      selectedFrame,
      originalFrameScopes,
      generatedFrameScopes
    } = props;
    super(props, ...args);

    _defineProperty(this, "onToggleMapScopes", () => {
      this.props.toggleMapScopes();
    });

    this.state = {
      originalScopes: (0, _scopes.getScopes)(why, selectedFrame, originalFrameScopes),
      generatedScopes: (0, _scopes.getScopes)(why, selectedFrame, generatedFrameScopes),
      showOriginal: true
    };
  }

  componentWillReceiveProps(nextProps) {
    const {
      cx,
      selectedFrame,
      originalFrameScopes,
      generatedFrameScopes
    } = this.props;
    const isPausedChanged = cx.isPaused !== nextProps.cx.isPaused;
    const selectedFrameChanged = selectedFrame !== nextProps.selectedFrame;
    const originalFrameScopesChanged = originalFrameScopes !== nextProps.originalFrameScopes;
    const generatedFrameScopesChanged = generatedFrameScopes !== nextProps.generatedFrameScopes;

    if (isPausedChanged || selectedFrameChanged || originalFrameScopesChanged || generatedFrameScopesChanged) {
      this.setState({
        originalScopes: (0, _scopes.getScopes)(nextProps.why, nextProps.selectedFrame, nextProps.originalFrameScopes),
        generatedScopes: (0, _scopes.getScopes)(nextProps.why, nextProps.selectedFrame, nextProps.generatedFrameScopes)
      });
    }
  }

  renderScopesList() {
    const {
      cx,
      isLoading,
      openLink,
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement,
      mapScopesEnabled,
      setExpandedScope,
      expandedScopes
    } = this.props;
    const {
      originalScopes,
      generatedScopes,
      showOriginal
    } = this.state;
    const scopes = showOriginal && mapScopesEnabled && originalScopes || generatedScopes;

    function initiallyExpanded(item) {
      return expandedScopes.some(path => path == (0, _utils.getScopeItemPath)(item));
    }

    if (scopes && scopes.length > 0 && !isLoading) {
      return _react.default.createElement("div", {
        className: "pane scopes-list"
      }, _react.default.createElement(ObjectInspector, {
        roots: scopes,
        autoExpandAll: false,
        autoExpandDepth: 1,
        disableWrap: true,
        dimTopLevelWindow: true,
        openLink: openLink,
        createObjectClient: grip => (0, _firefox.createObjectClient)(grip),
        onDOMNodeClick: grip => openElementInInspector(grip),
        onInspectIconClick: grip => openElementInInspector(grip),
        onDOMNodeMouseOver: grip => highlightDomElement(grip),
        onDOMNodeMouseOut: grip => unHighlightDomElement(grip),
        setExpanded: (path, expand) => setExpandedScope(cx, path, expand),
        initiallyExpanded: initiallyExpanded
      }));
    }

    let stateText = L10N.getStr("scopes.notPaused");

    if (cx.isPaused) {
      if (isLoading) {
        stateText = L10N.getStr("loadingText");
      } else {
        stateText = L10N.getStr("scopes.notAvailable");
      }
    }

    return _react.default.createElement("div", {
      className: "pane scopes-list"
    }, _react.default.createElement("div", {
      className: "pane-info"
    }, stateText));
  }

  render() {
    return _react.default.createElement("div", {
      className: "scopes-content"
    }, this.renderScopesList());
  }

}

const mapStateToProps = state => {
  const cx = (0, _selectors.getThreadContext)(state);
  const selectedFrame = (0, _selectors.getSelectedFrame)(state, cx.thread);
  const selectedSource = (0, _selectors.getSelectedSource)(state);
  const {
    scope: originalFrameScopes,
    pending: originalPending
  } = (0, _selectors.getOriginalFrameScope)(state, cx.thread, selectedSource && selectedSource.id, selectedFrame && selectedFrame.id) || {
    scope: null,
    pending: false
  };
  const {
    scope: generatedFrameScopes,
    pending: generatedPending
  } = (0, _selectors.getGeneratedFrameScope)(state, cx.thread, selectedFrame && selectedFrame.id) || {
    scope: null,
    pending: false
  };
  return {
    cx,
    selectedFrame,
    mapScopesEnabled: (0, _selectors.isMapScopesEnabled)(state),
    isLoading: generatedPending || originalPending,
    why: (0, _selectors.getPauseReason)(state, cx.thread),
    originalFrameScopes,
    generatedFrameScopes,
    expandedScopes: (0, _selectors.getLastExpandedScopes)(state, cx.thread)
  };
};

var _default = (0, _connect.connect)(mapStateToProps, {
  openLink: _actions.default.openLink,
  openElementInInspector: _actions.default.openElementInInspectorCommand,
  highlightDomElement: _actions.default.highlightDomElement,
  unHighlightDomElement: _actions.default.unHighlightDomElement,
  toggleMapScopes: _actions.default.toggleMapScopes,
  setExpandedScope: _actions.default.setExpandedScope
})(Scopes);

exports.default = _default;