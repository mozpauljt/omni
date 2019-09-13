"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Outline = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _devtoolsContextmenu = require("devtools/client/debugger/dist/vendors").vendored["devtools-contextmenu"];

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _fuzzaldrinPlus = require("devtools/client/debugger/dist/vendors").vendored["fuzzaldrin-plus"];

loader.lazyRequireGetter(this, "_clipboard", "devtools/client/debugger/src/utils/clipboard");
loader.lazyRequireGetter(this, "_function", "devtools/client/debugger/src/utils/function");

var _actions = _interopRequireDefault(require("../../actions/index"));

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

var _OutlineFilter = _interopRequireDefault(require("./OutlineFilter"));

var _PreviewFunction = _interopRequireDefault(require("../shared/PreviewFunction"));

var _lodash = require("devtools/client/shared/vendor/lodash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Check whether the name argument matches the fuzzy filter argument
 */
const filterOutlineItem = (name, filter) => {
  // Set higher to make the fuzzaldrin filter more specific
  const FUZZALDRIN_FILTER_THRESHOLD = 15000;

  if (!filter) {
    return true;
  }

  if (filter.length === 1) {
    // when filter is a single char just check if it starts with the char
    return filter.toLowerCase() === name.toLowerCase()[0];
  }

  return (0, _fuzzaldrinPlus.score)(name, filter) > FUZZALDRIN_FILTER_THRESHOLD;
};

class Outline extends _react.Component {
  constructor(props) {
    super(props);
    this.updateFilter = this.updateFilter.bind(this);
    this.state = {
      filter: ""
    };
  }

  selectItem(location) {
    const {
      cx,
      selectedSource,
      selectLocation
    } = this.props;

    if (!selectedSource) {
      return;
    }

    selectLocation(cx, {
      sourceId: selectedSource.id,
      line: location.start.line,
      column: location.start.column
    });
  }

  onContextMenu(event, func) {
    event.stopPropagation();
    event.preventDefault();
    const {
      selectedSource,
      getFunctionText,
      flashLineRange,
      selectedLocation
    } = this.props;
    const copyFunctionKey = L10N.getStr("copyFunction.accesskey");
    const copyFunctionLabel = L10N.getStr("copyFunction.label");

    if (!selectedSource) {
      return;
    }

    const sourceLine = func.location.start.line;
    const functionText = getFunctionText(sourceLine);
    const copyFunctionItem = {
      id: "node-menu-copy-function",
      label: copyFunctionLabel,
      accesskey: copyFunctionKey,
      disabled: !functionText,
      click: () => {
        flashLineRange({
          start: func.location.start.line,
          end: func.location.end.line,
          sourceId: selectedLocation.sourceId
        });
        return (0, _clipboard.copyToTheClipboard)(functionText);
      }
    };
    const menuOptions = [copyFunctionItem];
    (0, _devtoolsContextmenu.showMenu)(event, menuOptions);
  }

  updateFilter(filter) {
    this.setState({
      filter: filter.trim()
    });
  }

  renderPlaceholder() {
    const placeholderMessage = this.props.selectedSource ? L10N.getStr("outline.noFunctions") : L10N.getStr("outline.noFileSelected");
    return _react.default.createElement("div", {
      className: "outline-pane-info"
    }, placeholderMessage);
  }

  renderLoading() {
    return _react.default.createElement("div", {
      className: "outline-pane-info"
    }, L10N.getStr("loadingText"));
  }

  renderFunction(func) {
    const {
      name,
      location,
      parameterNames
    } = func;
    return _react.default.createElement("li", {
      key: `${name}:${location.start.line}:${location.start.column}`,
      className: "outline-list__element",
      onClick: () => this.selectItem(location),
      onContextMenu: e => this.onContextMenu(e, func)
    }, _react.default.createElement("span", {
      className: "outline-list__element-icon"
    }, "\u03BB"), _react.default.createElement(_PreviewFunction.default, {
      func: {
        name,
        parameterNames
      }
    }));
  }

  renderClassFunctions(klass, functions) {
    if (klass == null || functions.length == 0) {
      return null;
    }

    const classFunc = functions.find(func => func.name === klass);
    const classFunctions = functions.filter(func => func.klass === klass);
    const classInfo = this.props.symbols.classes.find(c => c.name === klass);
    const heading = classFunc ? _react.default.createElement("h2", null, this.renderFunction(classFunc)) : _react.default.createElement("h2", {
      onClick: classInfo ? () => this.selectItem(classInfo.location) : null
    }, _react.default.createElement("span", {
      className: "keyword"
    }, "class"), " ", klass);
    return _react.default.createElement("li", {
      className: "outline-list__class",
      key: klass
    }, heading, _react.default.createElement("ul", {
      className: "outline-list__class-list"
    }, classFunctions.map(func => this.renderFunction(func))));
  }

  renderFunctions(functions) {
    const {
      filter
    } = this.state;
    let classes = (0, _lodash.uniq)(functions.map(func => func.klass));
    let namedFunctions = functions.filter(func => filterOutlineItem(func.name, filter) && !func.klass && !classes.includes(func.name));
    let classFunctions = functions.filter(func => filterOutlineItem(func.name, filter) && !!func.klass);

    if (this.props.alphabetizeOutline) {
      namedFunctions = (0, _lodash.sortBy)(namedFunctions, "name");
      classes = (0, _lodash.sortBy)(classes, "klass");
      classFunctions = (0, _lodash.sortBy)(classFunctions, "name");
    }

    return _react.default.createElement("ul", {
      className: "outline-list devtools-monospace",
      dir: "ltr"
    }, namedFunctions.map(func => this.renderFunction(func)), classes.map(klass => this.renderClassFunctions(klass, classFunctions)));
  }

  renderFooter() {
    return _react.default.createElement("div", {
      className: "outline-footer"
    }, _react.default.createElement("button", {
      onClick: this.props.onAlphabetizeClick,
      className: this.props.alphabetizeOutline ? "active" : ""
    }, L10N.getStr("outline.sortLabel")));
  }

  render() {
    const {
      symbols,
      selectedSource
    } = this.props;
    const {
      filter
    } = this.state;

    if (!selectedSource) {
      return this.renderPlaceholder();
    }

    if (!symbols || symbols.loading) {
      return this.renderLoading();
    }

    const symbolsToDisplay = symbols.functions.filter(func => func.name != "anonymous");

    if (symbolsToDisplay.length === 0) {
      return this.renderPlaceholder();
    }

    return _react.default.createElement("div", {
      className: "outline"
    }, _react.default.createElement("div", null, _react.default.createElement(_OutlineFilter.default, {
      filter: filter,
      updateFilter: this.updateFilter
    }), this.renderFunctions(symbolsToDisplay), this.renderFooter()));
  }

}

exports.Outline = Outline;

const mapStateToProps = state => {
  const selectedSource = (0, _selectors.getSelectedSourceWithContent)(state);
  const symbols = selectedSource ? (0, _selectors.getSymbols)(state, selectedSource) : null;
  return {
    cx: (0, _selectors.getContext)(state),
    symbols,
    selectedSource: selectedSource,
    selectedLocation: (0, _selectors.getSelectedLocation)(state),
    getFunctionText: line => {
      if (selectedSource) {
        return (0, _function.findFunctionText)(line, selectedSource, symbols);
      }

      return null;
    }
  };
};

var _default = (0, _connect.connect)(mapStateToProps, {
  selectLocation: _actions.default.selectLocation,
  flashLineRange: _actions.default.flashLineRange
})(Outline);

exports.default = _default;