"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Worker = undefined;

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _classnames = require("devtools/client/debugger/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_workers", "devtools/client/debugger/src/utils/workers");
loader.lazyRequireGetter(this, "_AccessibleImage", "devtools/client/debugger/src/components/shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Worker extends _react.Component {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), this.onSelectThread = () => {
      const { thread } = this.props;
      this.props.selectThread(this.props.cx, thread.actor);
    }, _temp;
  }

  render() {
    const { currentThread, isPaused, thread } = this.props;

    const worker = (0, _workers.isWorker)(thread);
    const label = worker ? (0, _workers.getDisplayName)(thread) : L10N.getStr("mainThread");

    return _react2.default.createElement(
      "div",
      {
        className: (0, _classnames2.default)("worker", {
          selected: thread.actor == currentThread
        }),
        key: thread.actor,
        onClick: this.onSelectThread
      },
      _react2.default.createElement(
        "div",
        { className: "icon" },
        _react2.default.createElement(_AccessibleImage2.default, { className: worker ? "worker" : "window" })
      ),
      _react2.default.createElement(
        "div",
        { className: "label" },
        label
      ),
      isPaused ? _react2.default.createElement(
        "div",
        { className: "pause-badge" },
        _react2.default.createElement(_AccessibleImage2.default, { className: "pause" })
      ) : null
    );
  }
}

exports.Worker = Worker; /* This Source Code Form is subject to the terms of the Mozilla Public
                          * License, v. 2.0. If a copy of the MPL was not distributed with this
                          * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const mapStateToProps = (state, props) => ({
  cx: (0, _selectors.getContext)(state),
  currentThread: (0, _selectors.getCurrentThread)(state),
  isPaused: (0, _selectors.getIsPaused)(state, props.thread.actor)
});

exports.default = (0, _connect.connect)(mapStateToProps, {
  selectThread: _actions2.default.selectThread
})(Worker);