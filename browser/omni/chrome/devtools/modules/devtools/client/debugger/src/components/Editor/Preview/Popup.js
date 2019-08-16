"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Popup = undefined;

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _devtoolsReps = require("devtools/client/shared/components/reps/reps.js");

var _devtoolsReps2 = _interopRequireDefault(_devtoolsReps);

loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_Popover", "devtools/client/debugger/src/components/shared/Popover");

var _Popover2 = _interopRequireDefault(_Popover);

loader.lazyRequireGetter(this, "_PreviewFunction", "devtools/client/debugger/src/components/shared/PreviewFunction");

var _PreviewFunction2 = _interopRequireDefault(_PreviewFunction);

loader.lazyRequireGetter(this, "_firefox", "devtools/client/debugger/src/client/firefox");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  REPS: { Rep },
  MODE,
  objectInspector
} = _devtoolsReps2.default; /* This Source Code Form is subject to the terms of the Mozilla Public
                             * License, v. 2.0. If a copy of the MPL was not distributed with this
                             * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const { ObjectInspector, utils } = objectInspector;

const {
  node: { nodeIsPrimitive, nodeIsFunction, nodeIsObject }
} = utils;

class Popup extends _react.Component {

  constructor(props) {
    super(props);

    this.calculateMaxHeight = () => {
      const { editorRef } = this.props;
      if (!editorRef) {
        return "auto";
      }

      const { height, top } = editorRef.getBoundingClientRect();
      const maxHeight = height + top;
      if (maxHeight < 250) {
        return maxHeight;
      }

      return 250;
    };

    this.onMouseOut = () => {
      const { clearPreview, cx } = this.props;
      clearPreview(cx);
    };
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
      preview: { result }
    } = this.props;

    return _react2.default.createElement(
      "div",
      {
        className: "preview-popup",
        onClick: () => selectSourceURL(cx, result.location.url, {
          line: result.location.line
        })
      },
      _react2.default.createElement(_PreviewFunction2.default, { func: result })
    );
  }

  renderObjectPreview() {
    const {
      preview: { properties },
      openLink,
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement
    } = this.props;

    return _react2.default.createElement(
      "div",
      {
        className: "preview-popup",
        style: { maxHeight: this.calculateMaxHeight() }
      },
      _react2.default.createElement(ObjectInspector, {
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
      })
    );
  }

  renderSimplePreview() {
    const {
      openLink,
      preview: { result }
    } = this.props;
    return _react2.default.createElement(
      "div",
      { className: "preview-popup" },
      Rep({
        object: result,
        mode: MODE.LONG,
        openLink
      })
    );
  }

  renderPreview() {
    // We don't have to check and
    // return on `false`, `""`, `0`, `undefined` etc,
    // these falsy simple typed value because we want to
    // do `renderSimplePreview` on these values below.
    const {
      preview: { root }
    } = this.props;

    if (nodeIsFunction(root)) {
      return this.renderFunctionPreview();
    }

    if (nodeIsObject(root)) {
      return _react2.default.createElement(
        "div",
        null,
        this.renderObjectPreview()
      );
    }

    return this.renderSimplePreview();
  }

  getPreviewType() {
    const {
      preview: { root }
    } = this.props;
    if (nodeIsPrimitive(root) || nodeIsFunction(root)) {
      return "tooltip";
    }

    return "popover";
  }

  render() {
    const {
      preview: { cursorPos, result },
      editorRef
    } = this.props;
    const type = this.getPreviewType();

    if (typeof result == "undefined" || result.optimizedOut) {
      return null;
    }

    return _react2.default.createElement(
      _Popover2.default,
      {
        targetPosition: cursorPos,
        type: type,
        editorRef: editorRef,
        target: this.props.preview.target,
        mouseout: this.onMouseOut
      },
      this.renderPreview()
    );
  }
}

exports.Popup = Popup;
function addHighlightToTargetSiblings(target, props) {
  // Look at target's pervious and next token siblings.
  // If they are the same token type, and are also found in the preview expression,
  // add the highlight class to them as well.

  const tokenType = target.classList.item(0);
  const previewExpression = props.preview.expression;

  if (tokenType && previewExpression && target.innerHTML !== previewExpression) {
    let nextSibling = target.nextElementSibling;
    while (nextSibling && nextSibling.className.includes(tokenType) && previewExpression.includes(nextSibling.innerHTML)) {
      nextSibling.classList.add("preview-token");
      nextSibling = nextSibling.nextElementSibling;
    }
    let previousSibling = target.previousElementSibling;
    while (previousSibling && previousSibling.className.includes(tokenType) && previewExpression.includes(previousSibling.innerHTML)) {
      previousSibling.classList.add("preview-token");
      previousSibling = previousSibling.previousElementSibling;
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
} = _actions2.default;

const mapDispatchToProps = {
  addExpression,
  selectSourceURL,
  openLink,
  openElementInInspector: openElementInInspectorCommand,
  highlightDomElement,
  unHighlightDomElement,
  clearPreview
};

exports.default = (0, _connect.connect)(mapStateToProps, mapDispatchToProps)(Popup);