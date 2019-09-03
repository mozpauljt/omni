"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _propTypes = _interopRequireDefault(require("devtools/client/shared/vendor/react-prop-types"));

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

loader.lazyRequireGetter(this, "_frames", "devtools/client/debugger/src/utils/pause/frames/index");

var _FrameMenu = _interopRequireDefault(require("./FrameMenu"));

var _AccessibleImage = _interopRequireDefault(require("../../shared/AccessibleImage"));

var _Frame = _interopRequireDefault(require("./Frame"));

var _actions = _interopRequireDefault(require("../../../actions/index"));

var _Badge = _interopRequireDefault(require("../../shared/Badge"));

var _FrameIndent = _interopRequireDefault(require("./FrameIndent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function FrameLocation({
  frame,
  expanded
}) {
  const library = frame.library || (0, _frames.getLibraryFromUrl)(frame);

  if (!library) {
    return null;
  }

  const arrowClassName = (0, _classnames.default)("arrow", {
    expanded
  });
  return _react.default.createElement("span", {
    className: "group-description"
  }, _react.default.createElement(_AccessibleImage.default, {
    className: arrowClassName
  }), _react.default.createElement(_AccessibleImage.default, {
    className: `annotation-logo ${library.toLowerCase()}`
  }), _react.default.createElement("span", {
    className: "group-description-name"
  }, library));
}

FrameLocation.displayName = "FrameLocation";

class Group extends _react.Component {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "toggleFrames", event => {
      event.stopPropagation();
      this.setState(prevState => ({
        expanded: !prevState.expanded
      }));
    });

    this.state = {
      expanded: false
    };
  }

  onContextMenu(event) {
    const {
      group,
      copyStackTrace,
      toggleFrameworkGrouping,
      toggleBlackBox,
      frameworkGroupingOn,
      cx
    } = this.props;
    const frame = group[0];
    (0, _FrameMenu.default)(frame, frameworkGroupingOn, {
      copyStackTrace,
      toggleFrameworkGrouping,
      toggleBlackBox
    }, event, cx);
  }

  renderFrames() {
    const {
      cx,
      group,
      selectFrame,
      selectedFrame,
      toggleFrameworkGrouping,
      frameworkGroupingOn,
      toggleBlackBox,
      copyStackTrace,
      displayFullUrl,
      getFrameTitle,
      disableContextMenu,
      selectable
    } = this.props;
    const {
      expanded
    } = this.state;

    if (!expanded) {
      return null;
    }

    return _react.default.createElement("div", {
      className: "frames-list"
    }, group.reduce((acc, frame, i) => {
      if (selectable) {
        acc.push(_react.default.createElement(_FrameIndent.default, {
          key: `frame-indent-${i}`
        }));
      }

      return acc.concat(_react.default.createElement(_Frame.default, {
        cx: cx,
        copyStackTrace: copyStackTrace,
        frame: frame,
        frameworkGroupingOn: frameworkGroupingOn,
        hideLocation: true,
        key: frame.id,
        selectedFrame: selectedFrame,
        selectFrame: selectFrame,
        shouldMapDisplayName: false,
        toggleBlackBox: toggleBlackBox,
        toggleFrameworkGrouping: toggleFrameworkGrouping,
        displayFullUrl: displayFullUrl,
        getFrameTitle: getFrameTitle,
        disableContextMenu: disableContextMenu,
        selectable: selectable
      }));
    }, []));
  }

  renderDescription() {
    const {
      l10n
    } = this.context;
    const {
      selectable,
      group
    } = this.props;
    const frame = group[0];
    const expanded = this.state.expanded;
    const l10NEntry = this.state.expanded ? "callStack.group.collapseTooltip" : "callStack.group.expandTooltip";
    const title = l10n.getFormatStr(l10NEntry, frame.library);
    return _react.default.createElement("div", {
      role: "listitem",
      key: frame.id,
      className: (0, _classnames.default)("group"),
      onClick: this.toggleFrames,
      tabIndex: 0,
      title: title
    }, selectable && _react.default.createElement(_FrameIndent.default, null), _react.default.createElement(FrameLocation, {
      frame: frame,
      expanded: expanded
    }), selectable && _react.default.createElement("span", {
      className: "clipboard-only"
    }, " "), _react.default.createElement(_Badge.default, null, this.props.group.length), selectable && _react.default.createElement("br", {
      className: "clipboard-only"
    }));
  }

  render() {
    const {
      expanded
    } = this.state;
    const {
      disableContextMenu
    } = this.props;
    return _react.default.createElement("div", {
      className: (0, _classnames.default)("frames-group", {
        expanded
      }),
      onContextMenu: disableContextMenu ? null : e => this.onContextMenu(e)
    }, this.renderDescription(), this.renderFrames());
  }

}

exports.default = Group;
Group.displayName = "Group";
Group.contextTypes = {
  l10n: _propTypes.default.object
};