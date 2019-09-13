"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addHighlightToTargetSiblings = addHighlightToTargetSiblings;
exports.removeHighlightForTargetSiblings = removeHighlightForTargetSiblings;
exports.default = exports.Popup = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _devtoolsReps = _interopRequireDefault(require("devtools/client/shared/components/reps/reps.js"));

var _actions = _interopRequireDefault(require("../../../actions/index"));

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

var _Popover = _interopRequireDefault(require("../../shared/Popover"));

var _PreviewFunction = _interopRequireDefault(require("../../shared/PreviewFunction"));

loader.lazyRequireGetter(this, "_firefox", "devtools/client/debugger/src/client/firefox");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  REPS: {
    Rep
  },
  MODE,
  objectInspector
} = _devtoolsReps.default;
const {
  ObjectInspector,
  utils
} = objectInspector;
const {
  node: {
    nodeIsPrimitive,
    nodeIsFunction,
    nodeIsObject
  }
} = utils;

class Popup extends _react.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "calculateMaxHeight", () => {
      const {
        editorRef
      } = this.props;

      if (!editorRef) {
        return "auto";
      }

      const {
        height,
        top
      } = editorRef.getBoundingClientRect();
      const maxHeight = height + top;

      if (maxHeight < 250) {
        return maxHeight;
      }

      return 250;
    });

    _defineProperty(this, "onMouseOut", () => {
      const {
        clearPreview,
        cx
      } = this.props;
      clearPreview(cx);
    });
  }

  componentDidMount() {
    this.addHighlightToToken();
  }

  componentWillUnmount() {
    this.removeHighlightFromToken();
  }

  addHighlightToToken() {
    const target = this.props.preview.target;

    if (target) {
      target.classList.add("preview-token");
      addHighlightToTargetSiblings(target, this.props);
    }
  }

  removeHighlightFromToken() {
    const target = this.props.preview.target;

    if (target) {
      target.classList.remove("preview-token");
      removeHighlightForTargetSiblings(target);
    }
  }

  renderFunctionPreview() {
    const {
      cx,
      selectSourceURL,
      preview: {
        result
      }
    } = this.props;
    return _react.default.createElement("div", {
      className: "preview-popup",
      onClick: () => selectSourceURL(cx, result.location.url, {
        line: result.location.line
      })
    }, _react.default.createElement(_PreviewFunction.default, {
      func: result
    }));
  }

  renderObjectPreview() {
    const {
      preview: {
        properties
      },
      openLink,
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement
    } = this.props;
    return _react.default.createElement("div", {
      className: "preview-popup",
      style: {
        maxHeight: this.calculateMaxHeight()
      }
    }, _react.default.createElement(ObjectInspector, {
      roots: properties,
      autoExpandDepth: 0,
      disableWrap: true,
      focusable: false,
      openLink: openLink,
      createObjectClient: grip => (0, _firefox.createObjectClient)(grip),
      onDOMNodeClick: grip => openElementInInspector(grip),
      onInspectIconClick: grip => openElementInInspector(grip),
      onDOMNodeMouseOver: grip => highlightDomElement(grip),
      onDOMNodeMouseOut: grip => unHighlightDomElement(grip)
    }));
  }

  renderSimplePreview() {
    const {
      openLink,
      preview: {
        result
      }
    } = this.props;
    return _react.default.createElement("div", {
      className: "preview-popup"
    }, Rep({
      object: result,
      mode: MODE.LONG,
      openLink
    }));
  }

  renderPreview() {
    // We don't have to check and
    // return on `false`, `""`, `0`, `undefined` etc,
    // these falsy simple typed value because we want to
    // do `renderSimplePreview` on these values below.
    const {
      preview: {
        root
      }
    } = this.props;

    if (nodeIsFunction(root)) {
      return this.renderFunctionPreview();
    }

    if (nodeIsObject(root)) {
      return _react.default.createElement("div", null, this.renderObjectPreview());
    }

    return this.renderSimplePreview();
  }

  getPreviewType() {
    const {
      preview: {
        root
      }
    } = this.props;

    if (nodeIsPrimitive(root) || nodeIsFunction(root)) {
      return "tooltip";
    }

    return "popover";
  }

  render() {
    const {
      preview: {
        cursorPos,
        result
      },
      editorRef
    } = this.props;
    const type = this.getPreviewType();

    if (typeof result == "undefined" || result.optimizedOut) {
      return null;
    }

    return _react.default.createElement(_Popover.default, {
      targetPosition: cursorPos,
      type: type,
      editorRef: editorRef,
      target: this.props.preview.target,
      mouseout: this.onMouseOut
    }, this.renderPreview());
  }

}

exports.Popup = Popup;

function addHighlightToTargetSiblings(target, props) {
  // This function searches for related tokens that should also be highlighted when previewed.
  // Here is the process:
  // It conducts a search on the target's next siblings and then another search for the previous siblings.
  // If a sibling is not an element node (nodeType === 1), the highlight is not added and the search is short-circuited.
  // If the element sibling is the same token type as the target, and is also found in the preview expression, the highlight class is added.
  const tokenType = target.classList.item(0);
  const previewExpression = props.preview.expression;

  if (tokenType && previewExpression && target.innerHTML !== previewExpression) {
    let nextSibling = target.nextSibling;
    let nextElementSibling = target.nextElementSibling; // Note: Declaring previous/next ELEMENT siblings as well because
    // properties like innerHTML can't be checked on nextSibling
    // without creating a flow error even if the node is an element type.

    while (nextSibling && nextElementSibling && nextSibling.nodeType === 1 && nextElementSibling.className.includes(tokenType) && previewExpression.includes(nextElementSibling.innerHTML)) {
      // All checks passed, add highlight and continue the search.
      nextElementSibling.classList.add("preview-token");
      nextSibling = nextSibling.nextSibling;
      nextElementSibling = nextElementSibling.nextElementSibling;
    }

    let previousSibling = target.previousSibling;
    let previousElementSibling = target.previousElementSibling;

    while (previousSibling && previousElementSibling && previousSibling.nodeType === 1 && previousElementSibling.className.includes(tokenType) && previewExpression.includes(previousElementSibling.innerHTML)) {
      // All checks passed, add highlight and continue the search.
      previousElementSibling.classList.add("preview-token");
      previousSibling = previousSibling.previousSibling;
      previousElementSibling = previousElementSibling.previousElementSibling;
    }
  }
}

function removeHighlightForTargetSiblings(target) {
  // Look at target's previous and next token siblings.
  // If they also have the highlight class 'preview-token',
  // remove that class.
  let nextSibling = target.nextElementSibling;

  while (nextSibling && nextSibling.className.includes("preview-token")) {
    nextSibling.classList.remove("preview-token");
    nextSibling = nextSibling.nextElementSibling;
  }

  let previousSibling = target.previousElementSibling;

  while (previousSibling && previousSibling.className.includes("preview-token")) {
    previousSibling.classList.remove("preview-token");
    previousSibling = previousSibling.previousElementSibling;
  }
}

const mapStateToProps = state => ({
  cx: (0, _selectors.getThreadContext)(state),
  preview: (0, _selectors.getPreview)(state)
});

const {
  addExpression,
  selectSourceURL,
  openLink,
  openElementInInspectorCommand,
  highlightDomElement,
  unHighlightDomElement,
  clearPreview
} = _actions.default;
const mapDispatchToProps = {
  addExpression,
  selectSourceURL,
  openLink,
  openElementInInspector: openElementInInspectorCommand,
  highlightDomElement,
  unHighlightDomElement,
  clearPreview
};

var _default = (0, _connect.connect)(mapStateToProps, mapDispatchToProps)(Popup);

exports.default = _default;