"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Workers = undefined;

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_workers", "devtools/client/debugger/src/utils/workers");
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
loader.lazyRequireGetter(this, "_Worker", "devtools/client/debugger/src/components/SecondaryPanes/Worker");

var _Worker2 = _interopRequireDefault(_Worker);

loader.lazyRequireGetter(this, "_AccessibleImage", "devtools/client/debugger/src/components/shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class Workers extends _react.Component {
  renderWorker(thread) {
    const { openWorkerToolbox } = this.props;

    return _react2.default.createElement(
      "div",
      {
        className: "worker",
        key: thread.actor,
        onClick: () => openWorkerToolbox(thread)
      },
      _react2.default.createElement(
        "div",
        { className: "icon" },
        _react2.default.createElement(_AccessibleImage2.default, { className: "worker" })
      ),
      _react2.default.createElement(
        "div",
        { className: "label" },
        (0, _workers.getDisplayName)(thread)
      )
    );
  }

  render() {
    const { threads } = this.props;

    const workerList = _prefs.features.windowlessWorkers ? threads.map(thread => _react2.default.createElement(_Worker2.default, { thread: thread, key: thread.actor })) : threads.filter(thread => thread.actorID).map(worker => this.renderWorker(worker));

    return _react2.default.createElement(
      "div",
      { className: "pane workers-list" },
      workerList
    );
  }
}

exports.Workers = Workers;
const mapStateToProps = state => ({
  threads: (0, _selectors.getThreads)(state)
});

exports.default = (0, _connect.connect)(mapStateToProps, {
  openWorkerToolbox: _actions2.default.openWorkerToolbox
})(Workers);