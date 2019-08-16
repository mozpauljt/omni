"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _devtoolsReps = require("devtools/client/shared/components/reps/reps.js");

var _devtoolsReps2 = _interopRequireDefault(_devtoolsReps);

var _inspectorSharedUtils = require("devtools/client/inspector/shared/utils");

var _frameworkActions = require("devtools/client/framework/actions/index");

loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_Button", "devtools/client/debugger/src/components/shared/Button/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const {
  REPS: { Rep },
  MODE
} = _devtoolsReps2.default;


const localizationTerms = {
  subtree: L10N.getStr("domMutationTypes.subtree"),
  attribute: L10N.getStr("domMutationTypes.attribute"),
  removal: L10N.getStr("domMutationTypes.removal")
};

class DOMMutationBreakpointsContents extends _react.Component {
  renderItem(breakpoint) {
    const {
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement,
      toggleBreakpoint,
      deleteBreakpoint
    } = this.props;
    return _react2.default.createElement(
      "li",
      null,
      _react2.default.createElement("input", {
        type: "checkbox",
        checked: breakpoint.enabled,
        onChange: () => toggleBreakpoint(breakpoint.id, !breakpoint.enabled)
      }),
      _react2.default.createElement(
        "div",
        { className: "dom-mutation-info" },
        _react2.default.createElement(
          "div",
          { className: "dom-mutation-label" },
          Rep({
            object: (0, _inspectorSharedUtils.translateNodeFrontToGrip)(breakpoint.nodeFront),
            mode: MODE.LONG,
            onDOMNodeClick: grip => openElementInInspector(grip),
            onInspectIconClick: grip => openElementInInspector(grip),
            onDOMNodeMouseOver: grip => highlightDomElement(grip),
            onDOMNodeMouseOut: grip => unHighlightDomElement(grip)
          })
        ),
        _react2.default.createElement(
          "div",
          { className: "dom-mutation-type" },
          localizationTerms[breakpoint.mutationType] || breakpoint.mutationType
        )
      ),
      _react2.default.createElement(_Button.CloseButton, {
        handleClick: () => deleteBreakpoint(breakpoint.nodeFront, breakpoint.mutationType)
      })
    );
  }

  renderEmpty() {
    return _react2.default.createElement(
      "div",
      { className: "dom-mutation-empty" },
      L10N.getStr("noDomMutationBreakpointsText")
    );
  }

  render() {
    const { breakpoints } = this.props;

    if (breakpoints.length === 0) {
      return this.renderEmpty();
    }

    return _react2.default.createElement(
      "ul",
      { className: "dom-mutation-list" },
      breakpoints.map(breakpoint => this.renderItem(breakpoint))
    );
  }
}

const mapStateToProps = state => ({
  breakpoints: state.domMutationBreakpoints.breakpoints
});

const DOMMutationBreakpointsPanel = (0, _connect.connect)(mapStateToProps, {
  deleteBreakpoint: _frameworkActions.deleteDOMMutationBreakpoint,
  toggleBreakpoint: _frameworkActions.toggleDOMMutationBreakpointState
}, undefined, { storeKey: "toolbox-store" })(DOMMutationBreakpointsContents);

class DomMutationBreakpoints extends _react.Component {
  render() {
    return _react2.default.createElement(DOMMutationBreakpointsPanel, {
      openElementInInspector: this.props.openElementInInspector,
      highlightDomElement: this.props.highlightDomElement,
      unHighlightDomElement: this.props.unHighlightDomElement
    });
  }
}

exports.default = (0, _connect.connect)(undefined, {
  // the debugger-specific action bound to the debugger store
  // since there is no `storeKey`
  openElementInInspector: _actions2.default.openElementInInspectorCommand,
  highlightDomElement: _actions2.default.highlightDomElement,
  unHighlightDomElement: _actions2.default.unHighlightDomElement
})(DomMutationBreakpoints);