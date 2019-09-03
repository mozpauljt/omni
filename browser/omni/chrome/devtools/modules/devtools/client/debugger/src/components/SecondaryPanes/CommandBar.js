"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _propTypes = _interopRequireDefault(require("devtools/client/shared/vendor/react-prop-types"));

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_text", "devtools/client/debugger/src/utils/text");

var _actions = _interopRequireDefault(require("../../actions/index"));

loader.lazyRequireGetter(this, "_CommandBarButton", "devtools/client/debugger/src/components/shared/Button/CommandBarButton");

var _AccessibleImage = _interopRequireDefault(require("../shared/AccessibleImage"));

loader.lazyRequireGetter(this, "_devtoolsServices", "Services");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
const isMacOS = _devtoolsServices.appinfo.OS === "Darwin"; // NOTE: the "resume" command will call either the resume or breakOnNext action
// depending on whether or not the debugger is paused or running

const COMMANDS = ["resume", "stepOver", "stepIn", "stepOut"];
const KEYS = {
  WINNT: {
    resume: "F8",
    stepOver: "F10",
    stepIn: "F11",
    stepOut: "Shift+F11"
  },
  Darwin: {
    resume: "Cmd+\\",
    stepOver: "Cmd+'",
    stepIn: "Cmd+;",
    stepOut: "Cmd+Shift+:",
    stepOutDisplay: "Cmd+Shift+;"
  },
  Linux: {
    resume: "F8",
    stepOver: "F10",
    stepIn: "F11",
    stepOut: "Shift+F11"
  }
};

function getKey(action) {
  return getKeyForOS(_devtoolsServices.appinfo.OS, action);
}

function getKeyForOS(os, action) {
  const osActions = KEYS[os] || KEYS.Linux;
  return osActions[action];
}

function formatKey(action) {
  const key = getKey(`${action}Display`) || getKey(action);

  if (isMacOS) {
    const winKey = getKeyForOS("WINNT", `${action}Display`) || getKeyForOS("WINNT", action); // display both Windows type and Mac specific keys

    return (0, _text.formatKeyShortcut)([key, winKey].join(" "));
  }

  return (0, _text.formatKeyShortcut)(key);
}

class CommandBar extends _react.Component {
  componentWillUnmount() {
    const shortcuts = this.context.shortcuts;
    COMMANDS.forEach(action => shortcuts.off(getKey(action)));

    if (isMacOS) {
      COMMANDS.forEach(action => shortcuts.off(getKeyForOS("WINNT", action)));
    }
  }

  componentDidMount() {
    const shortcuts = this.context.shortcuts;
    COMMANDS.forEach(action => shortcuts.on(getKey(action), (_, e) => this.handleEvent(e, action)));

    if (isMacOS) {
      // The Mac supports both the Windows Function keys
      // as well as the Mac non-Function keys
      COMMANDS.forEach(action => shortcuts.on(getKeyForOS("WINNT", action), (_, e) => this.handleEvent(e, action)));
    }
  }

  handleEvent(e, action) {
    const {
      cx
    } = this.props;
    e.preventDefault();
    e.stopPropagation();

    if (action === "resume") {
      this.props.cx.isPaused ? this.props.resume(cx) : this.props.breakOnNext(cx);
    } else {
      this.props[action](cx);
    }
  }

  renderStepButtons() {
    const {
      cx
    } = this.props;
    const className = cx.isPaused ? "active" : "disabled";
    const isDisabled = !cx.isPaused;
    return [this.renderPauseButton(), (0, _CommandBarButton.debugBtn)(() => this.props.stepOver(cx), "stepOver", className, L10N.getFormatStr("stepOverTooltip", formatKey("stepOver")), isDisabled), (0, _CommandBarButton.debugBtn)(() => this.props.stepIn(cx), "stepIn", className, L10N.getFormatStr("stepInTooltip", formatKey("stepIn")), isDisabled), (0, _CommandBarButton.debugBtn)(() => this.props.stepOut(cx), "stepOut", className, L10N.getFormatStr("stepOutTooltip", formatKey("stepOut")), isDisabled)];
  }

  resume() {
    this.props.resume(this.props.cx);
  }

  renderPauseButton() {
    const {
      cx,
      breakOnNext,
      isWaitingOnBreak
    } = this.props;

    if (cx.isPaused) {
      return (0, _CommandBarButton.debugBtn)(() => this.resume(), "resume", "active", L10N.getFormatStr("resumeButtonTooltip", formatKey("resume")));
    }

    if (isWaitingOnBreak) {
      return (0, _CommandBarButton.debugBtn)(null, "pause", "disabled", L10N.getStr("pausePendingButtonTooltip"), true);
    }

    return (0, _CommandBarButton.debugBtn)(() => breakOnNext(cx), "pause", "active", L10N.getFormatStr("pauseButtonTooltip", formatKey("resume")));
  }

  renderReplayButtons() {
    const {
      cx
    } = this.props;
    const className = cx.isPaused ? "active" : "disabled";
    return [(0, _CommandBarButton.debugBtn)(() => this.props.breakOnNext(cx), "pause", !cx.isPaused ? "active" : "disabled", L10N.getFormatStr("pauseButtonTooltip", formatKey("resume")), cx.isPaused), _react.default.createElement("div", {
      key: "divider-1",
      className: "divider"
    }), (0, _CommandBarButton.debugBtn)(() => this.props.rewind(cx), "rewind", className, "Rewind Execution", !cx.isPaused), (0, _CommandBarButton.debugBtn)(() => this.props.resume(cx), "resume", className, L10N.getFormatStr("resumeButtonTooltip", formatKey("resume")), !cx.isPaused), _react.default.createElement("div", {
      key: "divider-2",
      className: "divider"
    }), (0, _CommandBarButton.debugBtn)(() => this.props.reverseStepOver(cx), "reverseStepOver", className, "Reverse step over", !cx.isPaused), (0, _CommandBarButton.debugBtn)(() => this.props.stepOver(cx), "stepOver", className, L10N.getFormatStr("stepOverTooltip", formatKey("stepOver")), !cx.isPaused), _react.default.createElement("div", {
      key: "divider-3",
      className: "divider"
    }), (0, _CommandBarButton.debugBtn)(() => this.props.stepOut(cx), "stepOut", className, L10N.getFormatStr("stepOutTooltip", formatKey("stepOut")), !cx.isPaused), (0, _CommandBarButton.debugBtn)(() => this.props.stepIn(cx), "stepIn", className, L10N.getFormatStr("stepInTooltip", formatKey("stepIn")), !cx.isPaused)];
  }

  renderSkipPausingButton() {
    const {
      skipPausing,
      toggleSkipPausing
    } = this.props;

    if (!_prefs.features.skipPausing) {
      return null;
    }

    return _react.default.createElement("button", {
      className: (0, _classnames.default)("command-bar-button", "command-bar-skip-pausing", {
        active: skipPausing
      }),
      title: skipPausing ? L10N.getStr("undoSkipPausingTooltip.label") : L10N.getStr("skipPausingTooltip.label"),
      onClick: toggleSkipPausing
    }, _react.default.createElement(_AccessibleImage.default, {
      className: "disable-pausing"
    }));
  }

  render() {
    return _react.default.createElement("div", {
      className: (0, _classnames.default)("command-bar", {
        vertical: !this.props.horizontal
      })
    }, this.props.canRewind ? this.renderReplayButtons() : this.renderStepButtons(), _react.default.createElement("div", {
      className: "filler"
    }), this.renderSkipPausingButton());
  }

}

CommandBar.contextTypes = {
  shortcuts: _propTypes.default.object
};

const mapStateToProps = state => ({
  cx: (0, _selectors.getThreadContext)(state),
  isWaitingOnBreak: (0, _selectors.getIsWaitingOnBreak)(state, (0, _selectors.getCurrentThread)(state)),
  canRewind: (0, _selectors.getCanRewind)(state),
  skipPausing: (0, _selectors.getSkipPausing)(state)
});

var _default = (0, _connect.connect)(mapStateToProps, {
  resume: _actions.default.resume,
  stepIn: _actions.default.stepIn,
  stepOut: _actions.default.stepOut,
  stepOver: _actions.default.stepOver,
  breakOnNext: _actions.default.breakOnNext,
  rewind: _actions.default.rewind,
  reverseStepOver: _actions.default.reverseStepOver,
  pauseOnExceptions: _actions.default.pauseOnExceptions,
  toggleSkipPausing: _actions.default.toggleSkipPausing
})(CommandBar);

exports.default = _default;