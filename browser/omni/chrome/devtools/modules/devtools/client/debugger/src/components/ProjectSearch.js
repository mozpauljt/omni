"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProjectSearch = undefined;

var _propTypes = require("devtools/client/shared/vendor/react-prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _classnames = require("devtools/client/debugger/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_editor", "devtools/client/debugger/src/utils/editor/index");
loader.lazyRequireGetter(this, "_projectSearch", "devtools/client/debugger/src/utils/project-search");
loader.lazyRequireGetter(this, "_projectTextSearch", "devtools/client/debugger/src/reducers/project-text-search");
loader.lazyRequireGetter(this, "_sourcesTree", "devtools/client/debugger/src/utils/sources-tree/index");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_ManagedTree", "devtools/client/debugger/src/components/shared/ManagedTree");

var _ManagedTree2 = _interopRequireDefault(_ManagedTree);

loader.lazyRequireGetter(this, "_SearchInput", "devtools/client/debugger/src/components/shared/SearchInput");

var _SearchInput2 = _interopRequireDefault(_SearchInput);

loader.lazyRequireGetter(this, "_AccessibleImage", "devtools/client/debugger/src/components/shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

var _pluralForm = require("devtools/shared/plural-form");

var _pluralForm2 = _interopRequireDefault(_pluralForm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function getFilePath(item, index) {
  return item.type === "RESULT" ? `${item.sourceId}-${index || "$"}` : `${item.sourceId}-${item.line}-${item.column}-${index || "$"}`;
}

function sanitizeQuery(query) {
  // no '\' at end of query
  return query.replace(/\\$/, "");
}

class ProjectSearch extends _react.Component {
  constructor(props) {
    super(props);

    this.toggleProjectTextSearch = (key, e) => {
      const { cx, closeProjectSearch, setActiveSearch } = this.props;
      if (e) {
        e.preventDefault();
      }

      if (this.isProjectSearchEnabled()) {
        return closeProjectSearch(cx);
      }

      return setActiveSearch("project");
    };

    this.isProjectSearchEnabled = () => this.props.activeSearch === "project";

    this.selectMatchItem = matchItem => {
      this.props.selectSpecificLocation(this.props.cx, {
        sourceId: matchItem.sourceId,
        line: matchItem.line,
        column: matchItem.column
      });
      this.props.doSearchForHighlight(this.state.inputValue, (0, _editor.getEditor)(), matchItem.line, matchItem.column);
    };

    this.getResultCount = () => this.props.results.reduce((count, file) => count + file.matches.length, 0);

    this.onKeyDown = e => {
      if (e.key === "Escape") {
        return;
      }

      e.stopPropagation();

      if (e.key !== "Enter") {
        return;
      }
      this.setState({ focusedItem: null });
      const query = sanitizeQuery(this.state.inputValue);
      if (query) {
        this.doSearch(query);
      }
    };

    this.onHistoryScroll = query => {
      this.setState({ inputValue: query });
    };

    this.onEnterPress = () => {
      if (!this.isProjectSearchEnabled() || !this.state.focusedItem || this.state.inputFocused) {
        return;
      }
      if (this.state.focusedItem.type === "MATCH") {
        this.selectMatchItem(this.state.focusedItem);
      }
    };

    this.onFocus = item => {
      if (this.state.focusedItem !== item) {
        this.setState({ focusedItem: item });
      }
    };

    this.inputOnChange = e => {
      const inputValue = e.target.value;
      const { cx, clearSearch } = this.props;
      this.setState({ inputValue });
      if (inputValue === "") {
        clearSearch(cx);
      }
    };

    this.renderFile = (file, focused, expanded) => {
      const matchesLength = file.matches.length;
      const matches = ` (${matchesLength} match${matchesLength > 1 ? "es" : ""})`;

      return _react2.default.createElement(
        "div",
        {
          className: (0, _classnames2.default)("file-result", { focused }),
          key: file.sourceId
        },
        _react2.default.createElement(_AccessibleImage2.default, { className: (0, _classnames2.default)("arrow", { expanded }) }),
        _react2.default.createElement(_AccessibleImage2.default, { className: "file" }),
        _react2.default.createElement(
          "span",
          { className: "file-path" },
          (0, _sourcesTree.getRelativePath)(file.filepath)
        ),
        _react2.default.createElement(
          "span",
          { className: "matches-summary" },
          matches
        )
      );
    };

    this.renderMatch = (match, focused) => {
      return _react2.default.createElement(
        "div",
        {
          className: (0, _classnames2.default)("result", { focused }),
          onClick: () => setTimeout(() => this.selectMatchItem(match), 50)
        },
        _react2.default.createElement(
          "span",
          { className: "line-number", key: match.line },
          match.line
        ),
        (0, _projectSearch.highlightMatches)(match)
      );
    };

    this.renderItem = (item, depth, focused, _, expanded) => {
      if (item.type === "RESULT") {
        return this.renderFile(item, focused, expanded);
      }
      return this.renderMatch(item, focused);
    };

    this.renderResults = () => {
      const { status, results } = this.props;
      if (!this.props.query) {
        return;
      }
      if (results.length) {
        return _react2.default.createElement(_ManagedTree2.default, {
          getRoots: () => results,
          getChildren: file => file.matches || [],
          itemHeight: 24,
          autoExpandAll: true,
          autoExpandDepth: 1,
          autoExpandNodeChildrenLimit: 100,
          getParent: item => null,
          getPath: getFilePath,
          renderItem: this.renderItem,
          focused: this.state.focusedItem,
          onFocus: this.onFocus
        });
      }
      const msg = status === _projectTextSearch.statusType.fetching ? L10N.getStr("loadingText") : L10N.getStr("projectTextSearch.noResults");
      return _react2.default.createElement(
        "div",
        { className: "no-result-msg absolute-center" },
        msg
      );
    };

    this.renderSummary = () => {
      if (this.props.query !== "") {
        const resultsSummaryString = L10N.getStr("sourceSearch.resultsSummary2");
        const count = this.getResultCount();
        return _pluralForm2.default.get(count, resultsSummaryString).replace("#1", count);
      }
      return "";
    };

    this.state = {
      inputValue: this.props.query || "",
      inputFocused: false,
      focusedItem: null
    };
  }

  componentDidMount() {
    const { shortcuts } = this.context;

    shortcuts.on(L10N.getStr("projectTextSearch.key"), this.toggleProjectTextSearch);
    shortcuts.on("Enter", this.onEnterPress);
  }

  componentWillUnmount() {
    const { shortcuts } = this.context;
    shortcuts.off(L10N.getStr("projectTextSearch.key"), this.toggleProjectTextSearch);
    shortcuts.off("Enter", this.onEnterPress);
  }

  componentDidUpdate(prevProps) {
    // If the query changes in redux, also change it in the UI
    if (prevProps.query !== this.props.query) {
      this.setState({ inputValue: this.props.query });
    }
  }

  doSearch(searchTerm) {
    this.props.searchSources(this.props.cx, searchTerm);
  }

  shouldShowErrorEmoji() {
    return !this.getResultCount() && this.props.status === _projectTextSearch.statusType.done;
  }

  renderInput() {
    const { status } = this.props;
    return _react2.default.createElement(_SearchInput2.default, {
      query: this.state.inputValue,
      count: this.getResultCount(),
      placeholder: L10N.getStr("projectTextSearch.placeholder"),
      size: "big",
      showErrorEmoji: this.shouldShowErrorEmoji(),
      summaryMsg: this.renderSummary(),
      isLoading: status === _projectTextSearch.statusType.fetching,
      onChange: this.inputOnChange,
      onFocus: () => this.setState({ inputFocused: true }),
      onBlur: () => this.setState({ inputFocused: false }),
      onKeyDown: this.onKeyDown,
      onHistoryScroll: this.onHistoryScroll,
      handleClose:
      // TODO - This function doesn't quite match the signature.
      this.props.closeProjectSearch,
      ref: "searchInput"
    });
  }

  render() {
    if (!this.isProjectSearchEnabled()) {
      return null;
    }

    return _react2.default.createElement(
      "div",
      { className: "search-container" },
      _react2.default.createElement(
        "div",
        { className: "project-text-search" },
        _react2.default.createElement(
          "div",
          { className: "header" },
          this.renderInput()
        ),
        this.renderResults()
      )
    );
  }
}
exports.ProjectSearch = ProjectSearch;
ProjectSearch.contextTypes = {
  shortcuts: _propTypes2.default.object
};

const mapStateToProps = state => ({
  cx: (0, _selectors.getContext)(state),
  activeSearch: (0, _selectors.getActiveSearch)(state),
  results: (0, _selectors.getTextSearchResults)(state),
  query: (0, _selectors.getTextSearchQuery)(state),
  status: (0, _selectors.getTextSearchStatus)(state)
});

exports.default = (0, _connect.connect)(mapStateToProps, {
  closeProjectSearch: _actions2.default.closeProjectSearch,
  searchSources: _actions2.default.searchSources,
  clearSearch: _actions2.default.clearSearch,
  selectSpecificLocation: _actions2.default.selectSpecificLocation,
  setActiveSearch: _actions2.default.setActiveSearch,
  doSearchForHighlight: _actions2.default.doSearchForHighlight
})(ProjectSearch);