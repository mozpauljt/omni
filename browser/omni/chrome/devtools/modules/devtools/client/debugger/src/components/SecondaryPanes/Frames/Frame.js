"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _propTypes = _interopRequireDefault(require("devtools/client/shared/vendor/react-prop-types"));

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

var _AccessibleImage = _interopRequireDefault(require("../../shared/AccessibleImage"));

loader.lazyRequireGetter(this, "_frames", "devtools/client/debugger/src/utils/pause/frames/index");
loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");

var _FrameMenu = _interopRequireDefault(require("./FrameMenu"));

var _FrameIndent = _interopRequireDefault(require("./FrameIndent"));

var _actions = _interopRequireDefault(require("../../../actions/index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function FrameTitle({
  frame,
  options = {},
  l10n
}) {
  const displayName = (0, _frames.formatDisplayName)(frame, options, l10n);
  return _react.default.createElement("span", {
    className: "title"
  }, displayName);
}

function FrameLocation({
  frame,
  displayFullUrl = false
}) {
  if (!frame.source) {
    return null;
  }

  if (frame.library) {
    return _react.default.createElement("span", {
      className: "location"
    }, frame.library, _react.default.createElement(_AccessibleImage.default, {
      className: `annotation-logo ${frame.library.toLowerCase()}`
    }));
  }

  const {
    location,
    source
  } = frame;
  const filename = displayFullUrl ? (0, _source.getFileURL)(source, false) : (0, _source.getFilename)(source);
  return _react.default.createElement("span", {
    className: "location",
    title: source.url
  }, _react.default.createElement("span", {
    className: "filename"
  }, filename), ":", _react.default.createElement("span", {
    className: "line"
  }, location.line));
}

FrameLocation.displayName = "FrameLocation";

class FrameComponent extends _react.Component {
  onContextMenu(event) {
    const {
      frame,
      copyStackTrace,
      toggleFrameworkGrouping,
      toggleBlackBox,
      frameworkGroupingOn,
      cx
    } = this.props;
    (0, _FrameMenu.default)(frame, frameworkGroupingOn, {
      copyStackTrace,
      toggleFrameworkGrouping,
      toggleBlackBox
    }, event, cx);
  }

  onMouseDown(e, frame, selectedFrame) {
    if (e.button !== 0) {
      return;
    }

    this.props.selectFrame(this.props.cx, frame);
  }

  onKeyUp(event, frame, selectedFrame) {
    if (event.key != "Enter") {
      return;
    }

    this.props.selectFrame(this.props.cx, frame);
  }

  render() {
    const {
      frame,
      selectedFrame,
      hideLocation,
      shouldMapDisplayName,
      displayFullUrl,
      getFrameTitle,
      disableContextMenu,
      selectable
    } = this.props;
    const {
      l10n
    } = this.context;
    const className = (0, _classnames.default)("frame", {
      selected: selectedFrame && selectedFrame.id === frame.id
    });

    if (!frame.source) {
      throw new Error("no frame source");
    }

    const title = getFrameTitle ? getFrameTitle(`${(0, _source.getFileURL)(frame.source, false)}:${frame.location.line}`) : undefined;
    return _react.default.createElement("div", {
      role: "listitem",
      key: frame.id,
      className: className,
      onMouseDown: e => this.onMouseDown(e, frame, selectedFrame),
      onKeyUp: e => this.onKeyUp(e, frame, selectedFrame),
      onContextMenu: disableContextMenu ? null : e => this.onContextMenu(e),
      tabIndex: 0,
      title: title
    }, selectable && _react.default.createElement(_FrameIndent.default, null), _react.default.createElement(FrameTitle, {
      frame: frame,
      options: {
        shouldMapDisplayName
      },
      l10n: l10n
    }), !hideLocation && _react.default.createElement("span", {
      className: "clipboard-only"
    }, " "), !hideLocation && _react.default.createElement(FrameLocation, {
      frame: frame,
      displayFullUrl: displayFullUrl
    }), selectable && _react.default.createElement("br", {
      className: "clipboard-only"
    }));
  }

}

exports.default = FrameComponent;

_defineProperty(FrameComponent, "defaultProps", {
  hideLocation: false,
  shouldMapDisplayName: true,
  disableContextMenu: false
});

FrameComponent.displayName = "Frame";
FrameComponent.contextTypes = {
  l10n: _propTypes.default.object
};