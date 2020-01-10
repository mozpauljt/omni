"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _lodash = require("devtools/client/shared/vendor/lodash");

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/reducers/sources");

var _actions = _interopRequireDefault(require("../../actions/index"));

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function isSameLocation(frameLocation, selectedLocation) {
  if (!frameLocation.sourceUrl || !selectedLocation) {
    return;
  }

  return frameLocation.line === selectedLocation.line && frameLocation.column === selectedLocation.column && selectedLocation.sourceId.includes(frameLocation.sourceUrl);
}

function getBoundingClientRect(element) {
  if (!element) {
    // $FlowIgnore
    return;
  }

  return element.getBoundingClientRect();
}

class FrameTimeline extends _react.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "state", {
      scrubbing: false,
      percentage: 0,
      displayedLocation: null,
      displayedFrame: {}
    });

    _defineProperty(this, "onMouseDown", event => {
      const progress = this.getProgress(event.clientX);
      this.setState({
        scrubbing: true,
        percentage: progress
      });
    });

    _defineProperty(this, "onMouseUp", event => {
      const {
        seekToPosition,
        selectedLocation
      } = this.props;
      const progress = this.getProgress(event.clientX);
      const position = this.getPosition(progress);
      this.setState({
        scrubbing: false,
        percentage: progress,
        displayedLocation: selectedLocation
      });

      if (position) {
        seekToPosition(position);
      }
    });

    _defineProperty(this, "onMouseMove", event => {
      const percentage = this.getProgress(event.clientX);
      this.displayPreview(percentage);
      this.setState({
        percentage
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (!document.body) {
      return;
    } // To please Flow.


    const bodyClassList = document.body.classList;

    if (this.state.scrubbing && !prevState.scrubbing) {
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("mouseup", this.onMouseUp);
      bodyClassList.add("scrubbing");
    }

    if (!this.state.scrubbing && prevState.scrubbing) {
      document.removeEventListener("mousemove", this.onMouseMove);
      document.removeEventListener("mouseup", this.onMouseUp);
      bodyClassList.remove("scrubbing");
    }
  }

  getProgress(clientX) {
    const {
      width,
      left
    } = getBoundingClientRect(this._timeline);
    const progress = (clientX - left) / width * 100;

    if (progress < 0) {
      return 0;
    } else if (progress > 99) {
      return 99;
    }

    return progress;
  }

  getPosition(percentage) {
    const {
      framePositions
    } = this.props;

    if (!framePositions) {
      return;
    }

    if (!percentage) {
      percentage = this.state.percentage;
    }

    const displayedPositions = framePositions.filter(point => point.position.kind === "OnStep");
    const displayIndex = Math.floor(percentage / 100 * displayedPositions.length);
    return displayedPositions[displayIndex];
  }

  displayPreview(percentage) {
    const {
      previewLocation
    } = this.props;
    const position = this.getPosition(percentage);

    if (position) {
      previewLocation(position.location);
    }
  }

  getProgressForNewFrame() {
    const {
      framePositions,
      selectedLocation,
      selectedFrame
    } = this.props;
    this.setState({
      displayedLocation: selectedLocation,
      displayedFrame: selectedFrame
    });
    let progress = 0;

    if (!framePositions) {
      return progress;
    }

    const displayedPositions = framePositions.filter(point => point.position.kind === "OnStep");
    const index = displayedPositions.findIndex(pos => isSameLocation(pos.location, selectedLocation));

    if (index != -1) {
      progress = Math.floor(index / displayedPositions.length * 100);
      this.setState({
        percentage: progress
      });
    }

    return progress;
  }

  getVisibleProgress() {
    const {
      percentage,
      displayedLocation,
      displayedFrame,
      scrubbing
    } = this.state;
    const {
      selectedLocation,
      selectedFrame
    } = this.props;
    let progress = percentage;

    if (!(0, _lodash.isEqual)(displayedLocation, selectedLocation) && displayedFrame.index !== selectedFrame.index && !scrubbing) {
      progress = this.getProgressForNewFrame();
    }

    return progress;
  }

  renderMarker() {
    return _react.default.createElement("div", {
      className: "frame-timeline-marker",
      ref: r => this._marker = r
    });
  }

  renderProgress() {
    const progress = this.getVisibleProgress();
    let maxWidth = "100%";

    if (this._timeline && this._marker) {
      const timelineWidth = getBoundingClientRect(this._timeline).width;
      const markerWidth = getBoundingClientRect(this._timeline).width;
      maxWidth = timelineWidth - markerWidth - 2;
    }

    return _react.default.createElement("div", {
      className: "frame-timeline-progress",
      style: {
        width: `${progress}%`,
        "max-width": maxWidth
      }
    });
  }

  renderTimeline() {
    return _react.default.createElement("div", {
      className: "frame-timeline-bar",
      onMouseDown: this.onMouseDown,
      ref: r => this._timeline = r
    }, this.renderProgress(), this.renderMarker());
  }

  render() {
    const {
      scrubbing
    } = this.state;
    const {
      framePositions
    } = this.props;

    if (!framePositions) {
      return null;
    }

    return _react.default.createElement("div", {
      className: (0, _classnames.default)("frame-timeline-container", {
        scrubbing
      })
    }, this.renderTimeline());
  }

}

const mapStateToProps = state => {
  const selectedFrame = (0, _selectors.getSelectedFrame)(state, (0, _selectors.getThreadContext)(state).thread);
  return {
    framePositions: (0, _selectors.getFramePositions)(state),
    selectedLocation: (0, _sources.getSelectedLocation)(state),
    selectedFrame
  };
};

var _default = (0, _connect.connect)(mapStateToProps, {
  seekToPosition: _actions.default.seekToPosition,
  previewLocation: _actions.default.previewPausedLocation
})(FrameTimeline);

exports.default = _default;