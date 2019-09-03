"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_ui", "devtools/client/debugger/src/utils/ui");
loader.lazyRequireGetter(this, "_tabs", "devtools/client/debugger/src/utils/tabs");
loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");

var _actions = _interopRequireDefault(require("../../actions/index"));

var _lodash = require("devtools/client/shared/vendor/lodash");

var _Tab = _interopRequireDefault(require("./Tab"));

loader.lazyRequireGetter(this, "_Button", "devtools/client/debugger/src/components/shared/Button/index");

var _Dropdown = _interopRequireDefault(require("../shared/Dropdown"));

var _AccessibleImage = _interopRequireDefault(require("../shared/AccessibleImage"));

var _CommandBar = _interopRequireDefault(require("../SecondaryPanes/CommandBar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Tabs extends _react.PureComponent {
  constructor(props) {
    super(props);

    _defineProperty(this, "updateHiddenTabs", () => {
      if (!this.refs.sourceTabs) {
        return;
      }

      const {
        selectedSource,
        tabSources,
        moveTab
      } = this.props;
      const sourceTabEls = this.refs.sourceTabs.children;
      const hiddenTabs = (0, _tabs.getHiddenTabs)(tabSources, sourceTabEls);

      if (selectedSource && (0, _ui.isVisible)() && hiddenTabs.find(tab => tab.id == selectedSource.id)) {
        return moveTab(selectedSource.url, 0);
      }

      this.setState({
        hiddenTabs
      });
    });

    _defineProperty(this, "renderDropdownSource", source => {
      const {
        cx,
        selectSource
      } = this.props;
      const filename = (0, _source.getFilename)(source);

      const onClick = () => selectSource(cx, source.id);

      return _react.default.createElement("li", {
        key: source.id,
        onClick: onClick,
        title: (0, _source.getFileURL)(source, false)
      }, _react.default.createElement(_AccessibleImage.default, {
        className: `dropdown-icon ${this.getIconClass(source)}`
      }), _react.default.createElement("span", {
        className: "dropdown-label"
      }, filename));
    });

    this.state = {
      dropdownShown: false,
      hiddenTabs: []
    };
    this.onResize = (0, _lodash.debounce)(() => {
      this.updateHiddenTabs();
    });
  }

  componentDidUpdate(prevProps) {
    if (!(prevProps === this.props)) {
      this.updateHiddenTabs();
    }
  }

  componentDidMount() {
    window.requestIdleCallback(this.updateHiddenTabs);
    window.addEventListener("resize", this.onResize);
    window.document.querySelector(".editor-pane").addEventListener("resizeend", this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
    window.document.querySelector(".editor-pane").removeEventListener("resizeend", this.onResize);
  }
  /*
   * Updates the hiddenSourceTabs state, by
   * finding the source tabs which are wrapped and are not on the top row.
   */


  toggleSourcesDropdown(e) {
    this.setState(prevState => ({
      dropdownShown: !prevState.dropdownShown
    }));
  }

  getIconClass(source) {
    if ((0, _source.isPretty)(source)) {
      return "prettyPrint";
    }

    if (source.isBlackBoxed) {
      return "blackBox";
    }

    return "file";
  }

  renderTabs() {
    const {
      tabSources
    } = this.props;

    if (!tabSources) {
      return;
    }

    return _react.default.createElement("div", {
      className: "source-tabs",
      ref: "sourceTabs"
    }, tabSources.map((source, index) => _react.default.createElement(_Tab.default, {
      key: index,
      source: source
    })));
  }

  renderDropdown() {
    const hiddenTabs = this.state.hiddenTabs;

    if (!hiddenTabs || hiddenTabs.length == 0) {
      return null;
    }

    const Panel = _react.default.createElement("ul", null, hiddenTabs.map(this.renderDropdownSource));

    const icon = _react.default.createElement(_AccessibleImage.default, {
      className: "more-tabs"
    });

    return _react.default.createElement(_Dropdown.default, {
      panel: Panel,
      icon: icon
    });
  }

  renderCommandBar() {
    const {
      horizontal,
      endPanelCollapsed,
      isPaused
    } = this.props;

    if (!endPanelCollapsed || !isPaused) {
      return;
    }

    return _react.default.createElement(_CommandBar.default, {
      horizontal: horizontal
    });
  }

  renderStartPanelToggleButton() {
    return _react.default.createElement(_Button.PaneToggleButton, {
      position: "start",
      collapsed: this.props.startPanelCollapsed,
      handleClick: this.props.togglePaneCollapse
    });
  }

  renderEndPanelToggleButton() {
    const {
      horizontal,
      endPanelCollapsed,
      togglePaneCollapse
    } = this.props;

    if (!horizontal) {
      return;
    }

    return _react.default.createElement(_Button.PaneToggleButton, {
      position: "end",
      collapsed: endPanelCollapsed,
      handleClick: togglePaneCollapse,
      horizontal: horizontal
    });
  }

  render() {
    return _react.default.createElement("div", {
      className: "source-header"
    }, this.renderStartPanelToggleButton(), this.renderTabs(), this.renderDropdown(), this.renderEndPanelToggleButton(), this.renderCommandBar());
  }

}

const mapStateToProps = state => ({
  cx: (0, _selectors.getContext)(state),
  selectedSource: (0, _selectors.getSelectedSource)(state),
  tabSources: (0, _selectors.getSourcesForTabs)(state),
  isPaused: (0, _selectors.getIsPaused)(state, (0, _selectors.getCurrentThread)(state))
});

var _default = (0, _connect.connect)(mapStateToProps, {
  selectSource: _actions.default.selectSource,
  moveTab: _actions.default.moveTab,
  closeTab: _actions.default.closeTab,
  togglePaneCollapse: _actions.default.togglePaneCollapse,
  showSource: _actions.default.showSource
})(Tabs);

exports.default = _default;