"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _propTypes = require("devtools/client/shared/vendor/react-prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_Button", "devtools/client/debugger/src/components/shared/Button/index");
loader.lazyRequireGetter(this, "_AccessibleImage", "devtools/client/debugger/src/components/shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_editor", "devtools/client/debugger/src/utils/editor/index");
loader.lazyRequireGetter(this, "_resultList", "devtools/client/debugger/src/utils/result-list");

var _classnames = require("devtools/client/debugger/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

loader.lazyRequireGetter(this, "_SearchInput", "devtools/client/debugger/src/components/shared/SearchInput");

var _SearchInput2 = _interopRequireDefault(_SearchInput);

var _lodash = require("devtools/client/shared/vendor/lodash");

var _pluralForm = require("devtools/shared/plural-form");

var _pluralForm2 = _interopRequireDefault(_pluralForm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getShortcuts() {
  const searchAgainKey = L10N.getStr("sourceSearch.search.again.key3");
  const searchAgainPrevKey = L10N.getStr("sourceSearch.search.againPrev.key3");
  const searchKey = L10N.getStr("sourceSearch.search.key2");

  return {
    shiftSearchAgainShortcut: searchAgainPrevKey,
    searchAgainShortcut: searchAgainKey,
    searchShortcut: searchKey
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class SearchBar extends _react.Component {
  constructor(props) {
    super(props);

    this.onEscape = e => {
      this.closeSearch(e);
    };

    this.clearSearch = () => {
      const { editor: ed, query } = this.props;
      if (ed) {
        const ctx = { ed, cm: ed.codeMirror };
        (0, _editor.removeOverlay)(ctx, query);
      }
    };

    this.closeSearch = e => {
      const { cx, closeFileSearch, editor, searchOn, query } = this.props;
      this.clearSearch();
      if (editor && searchOn) {
        closeFileSearch(cx, editor);
        e.stopPropagation();
        e.preventDefault();
      }
      this.setState({ query, inputFocused: false });
    };

    this.toggleSearch = e => {
      e.stopPropagation();
      e.preventDefault();
      const { editor, searchOn, setActiveSearch } = this.props;

      // Set inputFocused to false, so that search query is highlighted whenever search shortcut is used, even if the input already has focus.
      this.setState({ inputFocused: false });

      if (!searchOn) {
        setActiveSearch("file");
      }

      if (this.props.searchOn && editor) {
        const query = editor.codeMirror.getSelection() || this.state.query;

        if (query !== "") {
          this.setState({ query, inputFocused: true });
          this.doSearch(query);
        } else {
          this.setState({ query: "", inputFocused: true });
        }
      }
    };

    this.doSearch = query => {
      const { cx, selectedSource, selectedContentLoaded } = this.props;
      if (!selectedSource || !selectedContentLoaded) {
        return;
      }

      this.props.doSearch(cx, query, this.props.editor);
    };

    this.traverseResults = (e, rev) => {
      e.stopPropagation();
      e.preventDefault();
      const editor = this.props.editor;

      if (!editor) {
        return;
      }
      this.props.traverseResults(this.props.cx, rev, editor);
    };

    this.onChange = e => {
      this.setState({ query: e.target.value });

      return this.doSearch(e.target.value);
    };

    this.onFocus = e => {
      this.setState({ inputFocused: true });
    };

    this.onBlur = e => {
      this.setState({ inputFocused: false });
    };

    this.onKeyDown = e => {
      if (e.key !== "Enter" && e.key !== "F3") {
        return;
      }

      this.traverseResults(e, e.shiftKey);
      e.preventDefault();
      return this.doSearch(e.target.value);
    };

    this.onHistoryScroll = query => {
      this.setState({ query });
      this.doSearch(query);
    };

    this.renderSearchModifiers = () => {
      const { cx, modifiers, toggleFileSearchModifier, query } = this.props;
      const { doSearch } = this;

      function SearchModBtn({ modVal, className, svgName, tooltip }) {
        const preppedClass = (0, _classnames2.default)(className, {
          active: modifiers && modifiers[modVal]
        });
        return _react2.default.createElement(
          "button",
          {
            className: preppedClass,
            onMouseDown: () => {
              toggleFileSearchModifier(cx, modVal);
              doSearch(query);
            },
            onKeyDown: e => {
              if (e.key === "Enter") {
                toggleFileSearchModifier(cx, modVal);
                doSearch(query);
              }
            },
            title: tooltip
          },
          _react2.default.createElement(_AccessibleImage2.default, { className: svgName })
        );
      }

      return _react2.default.createElement(
        "div",
        { className: "search-modifiers" },
        _react2.default.createElement("span", { className: "pipe-divider" }),
        _react2.default.createElement(
          "span",
          { className: "search-type-name" },
          L10N.getStr("symbolSearch.searchModifier.modifiersLabel")
        ),
        _react2.default.createElement(SearchModBtn, {
          modVal: "regexMatch",
          className: "regex-match-btn",
          svgName: "regex-match",
          tooltip: L10N.getStr("symbolSearch.searchModifier.regex")
        }),
        _react2.default.createElement(SearchModBtn, {
          modVal: "caseSensitive",
          className: "case-sensitive-btn",
          svgName: "case-match",
          tooltip: L10N.getStr("symbolSearch.searchModifier.caseSensitive")
        }),
        _react2.default.createElement(SearchModBtn, {
          modVal: "wholeWord",
          className: "whole-word-btn",
          svgName: "whole-word-match",
          tooltip: L10N.getStr("symbolSearch.searchModifier.wholeWord")
        })
      );
    };

    this.state = {
      query: props.query,
      selectedResultIndex: 0,
      count: 0,
      index: -1,
      inputFocused: false
    };
  }

  componentWillUnmount() {
    const shortcuts = this.context.shortcuts;
    const {
      searchShortcut,
      searchAgainShortcut,
      shiftSearchAgainShortcut
    } = getShortcuts();

    shortcuts.off(searchShortcut);
    shortcuts.off("Escape");
    shortcuts.off(searchAgainShortcut);
    shortcuts.off(shiftSearchAgainShortcut);
  }

  componentDidMount() {
    // overwrite this.doSearch with debounced version to
    // reduce frequency of queries
    this.doSearch = (0, _lodash.debounce)(this.doSearch, 100);
    const shortcuts = this.context.shortcuts;
    const {
      searchShortcut,
      searchAgainShortcut,
      shiftSearchAgainShortcut
    } = getShortcuts();

    shortcuts.on(searchShortcut, (_, e) => this.toggleSearch(e));
    shortcuts.on("Escape", (_, e) => this.onEscape(e));

    shortcuts.on(shiftSearchAgainShortcut, (_, e) => this.traverseResults(e, true));

    shortcuts.on(searchAgainShortcut, (_, e) => this.traverseResults(e, false));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.refs.resultList && this.refs.resultList.refs) {
      (0, _resultList.scrollList)(this.refs.resultList.refs, this.state.selectedResultIndex);
    }
  }

  // Handlers

  // Renderers
  buildSummaryMsg() {
    const {
      searchResults: { matchIndex, count, index },
      query
    } = this.props;

    if (query.trim() == "") {
      return "";
    }

    if (count == 0) {
      return L10N.getStr("editor.noResultsFound");
    }

    if (index == -1) {
      const resultsSummaryString = L10N.getStr("sourceSearch.resultsSummary1");
      return _pluralForm2.default.get(count, resultsSummaryString).replace("#1", count);
    }

    const searchResultsString = L10N.getStr("editor.searchResults1");
    return _pluralForm2.default.get(count, searchResultsString).replace("#1", count).replace("%d", matchIndex + 1);
  }

  shouldShowErrorEmoji() {
    const {
      query,
      searchResults: { count }
    } = this.props;
    return !!query && !count;
  }

  render() {
    const {
      searchResults: { count },
      searchOn,
      showClose = true,
      size = "big"
    } = this.props;

    if (!searchOn) {
      return _react2.default.createElement("div", null);
    }

    return _react2.default.createElement(
      "div",
      { className: "search-bar" },
      _react2.default.createElement(_SearchInput2.default, {
        query: this.state.query,
        count: count,
        placeholder: L10N.getStr("sourceSearch.search.placeholder2"),
        summaryMsg: this.buildSummaryMsg(),
        isLoading: false,
        onChange: this.onChange,
        onFocus: this.onFocus,
        onBlur: this.onBlur,
        showErrorEmoji: this.shouldShowErrorEmoji(),
        onKeyDown: this.onKeyDown,
        onHistoryScroll: this.onHistoryScroll,
        handleNext: e => this.traverseResults(e, false),
        handlePrev: e => this.traverseResults(e, true),
        shouldFocus: this.state.inputFocused,
        showClose: false
      }),
      _react2.default.createElement(
        "div",
        { className: "search-bottom-bar" },
        this.renderSearchModifiers(),
        showClose && _react2.default.createElement(
          _react2.default.Fragment,
          null,
          _react2.default.createElement("span", { className: "pipe-divider" }),
          _react2.default.createElement(_Button.CloseButton, { handleClick: this.closeSearch, buttonClass: size })
        )
      )
    );
  }
}

SearchBar.contextTypes = {
  shortcuts: _propTypes2.default.object
};

const mapStateToProps = state => {
  const selectedSource = (0, _selectors.getSelectedSource)(state);

  return {
    cx: (0, _selectors.getContext)(state),
    searchOn: (0, _selectors.getActiveSearch)(state) === "file",
    selectedSource,
    selectedContentLoaded: selectedSource ? !!(0, _selectors.getSourceContent)(state, selectedSource.id) : null,
    selectedLocation: (0, _selectors.getSelectedLocation)(state),
    query: (0, _selectors.getFileSearchQuery)(state),
    modifiers: (0, _selectors.getFileSearchModifiers)(state),
    highlightedLineRange: (0, _selectors.getHighlightedLineRange)(state),
    searchResults: (0, _selectors.getFileSearchResults)(state)
  };
};

exports.default = (0, _connect.connect)(mapStateToProps, {
  toggleFileSearchModifier: _actions2.default.toggleFileSearchModifier,
  setFileSearchQuery: _actions2.default.setFileSearchQuery,
  setActiveSearch: _actions2.default.setActiveSearch,
  closeFileSearch: _actions2.default.closeFileSearch,
  doSearch: _actions2.default.doSearch,
  traverseResults: _actions2.default.traverseResults
})(SearchBar);