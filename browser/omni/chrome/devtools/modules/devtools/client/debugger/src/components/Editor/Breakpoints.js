"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_Breakpoint", "devtools/client/debugger/src/components/Editor/Breakpoint");

var _Breakpoint2 = _interopRequireDefault(_Breakpoint);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_breakpoint", "devtools/client/debugger/src/utils/breakpoint/index");
loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_breakpoints", "devtools/client/debugger/src/components/Editor/menus/breakpoints");
loader.lazyRequireGetter(this, "_editor", "devtools/client/debugger/src/components/Editor/menus/editor");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Breakpoints extends _react.Component {
  render() {
    const {
      cx,
      breakpoints,
      selectedSource,
      editor,
      breakpointActions,
      editorActions
    } = this.props;

    if (!breakpoints || selectedSource.isBlackBoxed) {
      return null;
    }

    return _react2.default.createElement(
      "div",
      null,
      breakpoints.map(bp => {
        return _react2.default.createElement(_Breakpoint2.default, {
          cx: cx,
          key: (0, _breakpoint.makeBreakpointId)(bp.location),
          breakpoint: bp,
          selectedSource: selectedSource,
          editor: editor,
          breakpointActions: breakpointActions,
          editorActions: editorActions
        });
      })
    );
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

exports.default = (0, _connect.connect)(state => ({
  // Retrieves only the first breakpoint per line so that the
  // breakpoint marker represents only the first breakpoint
  breakpoints: (0, _selectors.getFirstVisibleBreakpoints)(state),
  selectedSource: (0, _selectors.getSelectedSource)(state)
}), dispatch => ({
  breakpointActions: (0, _breakpoints.breakpointItemActions)(dispatch),
  editorActions: (0, _editor.editorItemActions)(dispatch)
}))(Breakpoints);