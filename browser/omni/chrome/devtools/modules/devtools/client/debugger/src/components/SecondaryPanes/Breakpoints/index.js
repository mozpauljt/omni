"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _ExceptionOption = _interopRequireDefault(require("./ExceptionOption"));

var _Breakpoint = _interopRequireDefault(require("./Breakpoint"));

var _BreakpointHeading = _interopRequireDefault(require("./BreakpointHeading"));

var _actions = _interopRequireDefault(require("../../../actions/index"));

loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");
loader.lazyRequireGetter(this, "_selectedLocation", "devtools/client/debugger/src/utils/selected-location");
loader.lazyRequireGetter(this, "_createEditor", "devtools/client/debugger/src/utils/editor/create-editor");
loader.lazyRequireGetter(this, "_breakpoint", "devtools/client/debugger/src/utils/breakpoint/index");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

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
    return _react.default.createElement("div", {
      className: (0, _classnames.default)("breakpoints-exceptions-options", {
        empty: isEmpty
      })
    }, _react.default.createElement(_ExceptionOption.default, {
      className: "breakpoints-exceptions",
      label: L10N.getStr("pauseOnExceptionsItem2"),
      isChecked: shouldPauseOnExceptions,
      onChange: () => pauseOnExceptions(!shouldPauseOnExceptions, false)
    }), shouldPauseOnExceptions && _react.default.createElement(_ExceptionOption.default, {
      className: "breakpoints-exceptions-caught",
      label: L10N.getStr("pauseOnCaughtExceptionsItem"),
      isChecked: shouldPauseOnCaughtExceptions,
      onChange: () => pauseOnExceptions(true, !shouldPauseOnCaughtExceptions)
    }));
  }

  renderBreakpoints() {
    const {
      breakpointSources,
      selectedSource
    } = this.props;

    if (!breakpointSources.length) {
      return null;
    }

    const sources = [...breakpointSources.map(({
      source,
      breakpoints
    }) => source)];
    return _react.default.createElement("div", {
      className: "pane breakpoints-list"
    }, breakpointSources.map(({
      source,
      breakpoints,
      i
    }) => {
      const path = (0, _source.getDisplayPath)(source, sources);
      const sortedBreakpoints = (0, _breakpoint.sortSelectedBreakpoints)(breakpoints, selectedSource);
      return [_react.default.createElement(_BreakpointHeading.default, {
        source: source,
        sources: sources,
        path: path,
        key: source.url
      }), ...sortedBreakpoints.map(breakpoint => _react.default.createElement(_Breakpoint.default, {
        breakpoint: breakpoint,
        source: source,
        selectedSource: selectedSource,
        editor: this.getEditor(),
        key: (0, _breakpoint.makeBreakpointId)((0, _selectedLocation.getSelectedLocation)(breakpoint, selectedSource))
      }))];
    }));
  }

  render() {
    return _react.default.createElement("div", {
      className: "pane"
    }, this.renderExceptionsOptions(), this.renderBreakpoints());
  }

}

const mapStateToProps = state => ({
  breakpointSources: (0, _selectors.getBreakpointSources)(state),
  selectedSource: (0, _selectors.getSelectedSource)(state)
});

var _default = (0, _connect.connect)(mapStateToProps, {
  pauseOnExceptions: _actions.default.pauseOnExceptions
})(Breakpoints);

exports.default = _default;