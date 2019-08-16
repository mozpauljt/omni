"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("devtools/client/debugger/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_ExceptionOption", "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/ExceptionOption");

var _ExceptionOption2 = _interopRequireDefault(_ExceptionOption);

loader.lazyRequireGetter(this, "_Breakpoint", "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/Breakpoint");

var _Breakpoint2 = _interopRequireDefault(_Breakpoint);

loader.lazyRequireGetter(this, "_BreakpointHeading", "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointHeading");

var _BreakpointHeading2 = _interopRequireDefault(_BreakpointHeading);

loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");
loader.lazyRequireGetter(this, "_selectedLocation", "devtools/client/debugger/src/utils/selected-location");
loader.lazyRequireGetter(this, "_createEditor", "devtools/client/debugger/src/utils/editor/create-editor");
loader.lazyRequireGetter(this, "_breakpoint", "devtools/client/debugger/src/utils/breakpoint/index");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class Breakpoints extends _react.Component {

  componentWillUnmount() {
    this.removeEditor();
  }

  getEditor() {
    if (!this.headlessEditor) {
      this.headlessEditor = (0, _createEditor.createHeadlessEditor)();
    }
    return this.headlessEditor;
  }

  removeEditor() {
    if (!this.headlessEditor) {
      return;
    }
    this.headlessEditor.destroy();
    this.headlessEditor = null;
  }

  renderExceptionsOptions() {
    const {
      breakpointSources,
      shouldPauseOnExceptions,
      shouldPauseOnCaughtExceptions,
      pauseOnExceptions
    } = this.props;

    const isEmpty = breakpointSources.length == 0;

    return _react2.default.createElement(
      "div",
      {
        className: (0, _classnames2.default)("breakpoints-exceptions-options", {
          empty: isEmpty
        })
      },
      _react2.default.createElement(_ExceptionOption2.default, {
        className: "breakpoints-exceptions",
        label: L10N.getStr("pauseOnExceptionsItem2"),
        isChecked: shouldPauseOnExceptions,
        onChange: () => pauseOnExceptions(!shouldPauseOnExceptions, false)
      }),
      shouldPauseOnExceptions && _react2.default.createElement(_ExceptionOption2.default, {
        className: "breakpoints-exceptions-caught",
        label: L10N.getStr("pauseOnCaughtExceptionsItem"),
        isChecked: shouldPauseOnCaughtExceptions,
        onChange: () => pauseOnExceptions(true, !shouldPauseOnCaughtExceptions)
      })
    );
  }

  renderBreakpoints() {
    const { breakpointSources, selectedSource } = this.props;
    if (!breakpointSources.length) {
      return null;
    }

    const sources = [...breakpointSources.map(({ source, breakpoints }) => source)];

    return _react2.default.createElement(
      "div",
      { className: "pane breakpoints-list" },
      breakpointSources.map(({ source, breakpoints, i }) => {
        const path = (0, _source.getDisplayPath)(source, sources);
        const sortedBreakpoints = (0, _breakpoint.sortSelectedBreakpoints)(breakpoints, selectedSource);

        return [_react2.default.createElement(_BreakpointHeading2.default, {
          source: source,
          sources: sources,
          path: path,
          key: source.url
        }), ...sortedBreakpoints.map(breakpoint => _react2.default.createElement(_Breakpoint2.default, {
          breakpoint: breakpoint,
          source: source,
          selectedSource: selectedSource,
          editor: this.getEditor(),
          key: (0, _breakpoint.makeBreakpointId)((0, _selectedLocation.getSelectedLocation)(breakpoint, selectedSource))
        }))];
      })
    );
  }

  render() {
    const { skipPausing } = this.props;
    return _react2.default.createElement(
      "div",
      { className: (0, _classnames2.default)("pane", skipPausing && "skip-pausing") },
      this.renderExceptionsOptions(),
      this.renderBreakpoints()
    );
  }
}

const mapStateToProps = state => ({
  breakpointSources: (0, _selectors.getBreakpointSources)(state),
  selectedSource: (0, _selectors.getSelectedSource)(state),
  skipPausing: (0, _selectors.getSkipPausing)(state)
});

exports.default = (0, _connect.connect)(mapStateToProps, {
  pauseOnExceptions: _actions2.default.pauseOnExceptions
})(Breakpoints);