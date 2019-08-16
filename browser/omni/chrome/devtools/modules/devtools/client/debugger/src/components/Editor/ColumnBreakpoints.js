"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_ColumnBreakpoint", "devtools/client/debugger/src/components/Editor/ColumnBreakpoint");

var _ColumnBreakpoint2 = _interopRequireDefault(_ColumnBreakpoint);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_breakpoint", "devtools/client/debugger/src/utils/breakpoint/index");
loader.lazyRequireGetter(this, "_breakpoints", "devtools/client/debugger/src/components/Editor/menus/breakpoints");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// eslint-disable-next-line max-len
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class ColumnBreakpoints extends _react.Component {

  render() {
    const {
      cx,
      editor,
      columnBreakpoints,
      selectedSource,
      breakpointActions
    } = this.props;

    if (!selectedSource || selectedSource.isBlackBoxed) {
      return null;
    }

    let breakpoints;
    editor.codeMirror.operation(() => {
      breakpoints = columnBreakpoints.map(breakpoint => _react2.default.createElement(_ColumnBreakpoint2.default, {
        cx: cx,
        key: (0, _breakpoint.makeBreakpointId)(breakpoint.location),
        columnBreakpoint: breakpoint,
        editor: editor,
        source: selectedSource,
        breakpointActions: breakpointActions
      }));
    });
    return _react2.default.createElement(
      "div",
      null,
      breakpoints
    );
  }
}

const mapStateToProps = state => ({
  cx: (0, _selectors.getContext)(state),
  selectedSource: (0, _selectors.getSelectedSource)(state),
  columnBreakpoints: (0, _selectors.visibleColumnBreakpoints)(state)
});

exports.default = (0, _connect.connect)(mapStateToProps, dispatch => ({ breakpointActions: (0, _breakpoints.breakpointItemActions)(dispatch) }))(ColumnBreakpoints);