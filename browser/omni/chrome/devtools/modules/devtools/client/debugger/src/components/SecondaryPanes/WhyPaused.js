"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_AccessibleImage", "devtools/client/debugger/src/components/shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

loader.lazyRequireGetter(this, "_pause", "devtools/client/debugger/src/utils/pause/index");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class WhyPaused extends _react.PureComponent {
  constructor(props) {
    super(props);
    this.state = { hideWhyPaused: "" };
  }

  componentDidUpdate() {
    const { delay } = this.props;

    if (delay) {
      setTimeout(() => {
        this.setState({ hideWhyPaused: "" });
      }, delay);
    } else {
      this.setState({ hideWhyPaused: "pane why-paused" });
    }
  }

  renderExceptionSummary(exception) {
    if (typeof exception === "string") {
      return exception;
    }

    const preview = exception.preview;
    if (!preview || !preview.name || !preview.message) {
      return;
    }

    return `${preview.name}: ${preview.message}`;
  }

  renderMessage(why) {
    if (why.type == "exception" && why.exception) {
      return _react2.default.createElement(
        "div",
        { className: "message warning" },
        this.renderExceptionSummary(why.exception)
      );
    }

    if (typeof why.message == "string") {
      return _react2.default.createElement(
        "div",
        { className: "message" },
        why.message
      );
    }

    return null;
  }

  render() {
    const { endPanelCollapsed, why } = this.props;
    const reason = (0, _pause.getPauseReason)(why);

    if (!reason || endPanelCollapsed) {
      return _react2.default.createElement("div", { className: this.state.hideWhyPaused });
    }

    return _react2.default.createElement(
      "div",
      { className: "pane why-paused" },
      _react2.default.createElement(
        "div",
        null,
        _react2.default.createElement(
          "div",
          { className: "pause reason" },
          L10N.getStr(reason),
          this.renderMessage(why)
        ),
        _react2.default.createElement(
          "div",
          { className: "info icon" },
          _react2.default.createElement(_AccessibleImage2.default, { className: "info" })
        )
      )
    );
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const mapStateToProps = state => ({
  endPanelCollapsed: (0, _selectors.getPaneCollapse)(state, "end"),
  why: (0, _selectors.getPauseReason)(state, (0, _selectors.getCurrentThread)(state))
});

exports.default = (0, _connect.connect)(mapStateToProps)(WhyPaused);