"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("devtools/client/debugger/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_sources", "devtools/client/debugger/src/reducers/sources");
loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_SourcesTreeItem", "devtools/client/debugger/src/components/PrimaryPanes/SourcesTreeItem");

var _SourcesTreeItem2 = _interopRequireDefault(_SourcesTreeItem);

loader.lazyRequireGetter(this, "_ManagedTree", "devtools/client/debugger/src/components/shared/ManagedTree");

var _ManagedTree2 = _interopRequireDefault(_ManagedTree);

loader.lazyRequireGetter(this, "_sourcesTree", "devtools/client/debugger/src/utils/sources-tree/index");
loader.lazyRequireGetter(this, "_url", "devtools/client/debugger/src/utils/url");
loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Actions


// Selectors
function shouldAutoExpand(depth, item, debuggeeUrl, projectRoot) {
  if (projectRoot != "" || depth !== 1) {
    return false;
  }

  const { host } = (0, _url.parse)(debuggeeUrl);
  return item.name === host;
}

// Utils


// Components
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Dependencies


function findSource({ threads, sources }, itemPath, source) {
  const targetThread = threads.find(thread => itemPath.includes(thread.actor));
  if (targetThread && source) {
    const actor = targetThread.actor;
    return sources[actor][source.id];
  }
  return source;
}

class SourcesTree extends _react.Component {
  constructor(props) {
    super(props);

    _initialiseProps.call(this);

    const { debuggeeUrl, sources, threads } = this.props;

    this.state = (0, _sourcesTree.createTree)({
      debuggeeUrl,
      sources,
      threads
    });
  }

  componentWillReceiveProps(nextProps) {
    const {
      projectRoot,
      debuggeeUrl,
      sources,
      shownSource,
      selectedSource,
      threads
    } = this.props;
    const { uncollapsedTree, sourceTree } = this.state;

    if (projectRoot != nextProps.projectRoot || debuggeeUrl != nextProps.debuggeeUrl || threads != nextProps.threads || nextProps.sourceCount === 0) {
      // early recreate tree because of changes
      // to project root, debuggee url or lack of sources
      return this.setState((0, _sourcesTree.createTree)({
        sources: nextProps.sources,
        debuggeeUrl: nextProps.debuggeeUrl,
        threads: nextProps.threads
      }));
    }

    if (nextProps.shownSource && nextProps.shownSource != shownSource) {
      const listItems = (0, _sourcesTree.getDirectories)(nextProps.shownSource, sourceTree);
      return this.setState({ listItems });
    }

    if (nextProps.selectedSource && nextProps.selectedSource != selectedSource) {
      const highlightItems = (0, _sourcesTree.getDirectories)(nextProps.selectedSource, sourceTree);
      this.setState({ highlightItems });
    }

    // NOTE: do not run this every time a source is clicked,
    // only when a new source is added
    if (nextProps.sources != this.props.sources) {
      this.setState((0, _sourcesTree.updateTree)({
        newSources: nextProps.sources,
        threads: nextProps.threads,
        prevSources: sources,
        debuggeeUrl,
        uncollapsedTree,
        sourceTree
      }));
    }
  }

  // NOTE: we get the source from sources because item.contents is cached
  getSource(item) {
    const source = (0, _sourcesTree.getSourceFromNode)(item);
    return findSource(this.props, item.path, source);
  }

  isEmpty() {
    const { sourceTree } = this.state;
    return sourceTree.contents.length === 0;
  }

  renderEmptyElement(message) {
    return _react2.default.createElement(
      "div",
      { key: "empty", className: "no-sources-message" },
      message
    );
  }

  renderTree() {
    const { expanded, focused, projectRoot } = this.props;

    const { highlightItems, listItems, parentMap, sourceTree } = this.state;

    const treeProps = {
      autoExpandAll: false,
      autoExpandDepth: 1,
      expanded,
      focused,
      getChildren: this.getChildren,
      getParent: item => parentMap.get(item),
      getPath: this.getPath,
      getRoots: () => this.getRoots(sourceTree, projectRoot),
      highlightItems,
      itemHeight: 21,
      key: this.isEmpty() ? "empty" : "full",
      listItems,
      onCollapse: this.onCollapse,
      onExpand: this.onExpand,
      onFocus: this.onFocus,
      onActivate: this.onActivate,
      renderItem: this.renderItem,
      preventBlur: true
    };

    return _react2.default.createElement(_ManagedTree2.default, treeProps);
  }

  renderPane(...children) {
    const { projectRoot } = this.props;

    return _react2.default.createElement(
      "div",
      {
        key: "pane",
        className: (0, _classnames2.default)("sources-pane", {
          "sources-list-custom-root": projectRoot
        })
      },
      children
    );
  }

  render() {
    return this.renderPane(this.isEmpty() ? this.renderEmptyElement(L10N.getStr("noSourcesText")) : _react2.default.createElement(
      "div",
      { key: "tree", className: "sources-list" },
      this.renderTree()
    ));
  }
}

var _initialiseProps = function () {
  this.selectItem = item => {
    if (item.type == "source" && !Array.isArray(item.contents)) {
      this.props.selectSource(this.props.cx, item.contents.id);
    }
  };

  this.onFocus = item => {
    this.props.focusItem(item);
  };

  this.onActivate = item => {
    this.selectItem(item);
  };

  this.getPath = item => {
    const { path } = item;
    const source = this.getSource(item);

    if (!source || (0, _sourcesTree.isDirectory)(item)) {
      return path;
    }

    const blackBoxedPart = source.isBlackBoxed ? ":blackboxed" : "";

    return `${path}/${source.id}/${blackBoxedPart}`;
  };

  this.onExpand = (item, expandedState) => {
    this.props.setExpandedState(expandedState);
  };

  this.onCollapse = (item, expandedState) => {
    this.props.setExpandedState(expandedState);
  };

  this.getRoots = (sourceTree, projectRoot) => {
    const sourceContents = sourceTree.contents[0];

    if (projectRoot && sourceContents) {
      const roots = (0, _sourcesTree.findSourceTreeNodes)(sourceTree, projectRoot);
      // NOTE if there is one root, we want to show its content
      // TODO with multiple roots we should try and show the thread name
      return roots && roots.length == 1 ? roots[0].contents : roots;
    }

    return sourceTree.contents;
  };

  this.getChildren = item => {
    return (0, _sourcesTree.nodeHasChildren)(item) ? item.contents : [];
  };

  this.renderItem = (item, depth, focused, _, expanded, { setExpanded }) => {
    const { debuggeeUrl, projectRoot, threads } = this.props;

    return _react2.default.createElement(_SourcesTreeItem2.default, {
      item: item,
      threads: threads,
      depth: depth,
      focused: focused,
      autoExpand: shouldAutoExpand(depth, item, debuggeeUrl, projectRoot),
      expanded: expanded,
      focusItem: this.onFocus,
      selectItem: this.selectItem,
      source: this.getSource(item),
      debuggeeUrl: debuggeeUrl,
      projectRoot: projectRoot,
      setExpanded: setExpanded
    });
  };
};

function getSourceForTree(state, displayedSources, source) {
  if (!source) {
    return null;
  }

  if (!source || !source.isPrettyPrinted) {
    return source;
  }

  return (0, _sources.getGeneratedSourceByURL)(state, (0, _source.getRawSourceURL)(source.url));
}

const mapStateToProps = (state, props) => {
  const selectedSource = (0, _selectors.getSelectedSource)(state);
  const shownSource = (0, _selectors.getShownSource)(state);
  const displayedSources = (0, _selectors.getDisplayedSources)(state);

  return {
    threads: props.threads,
    cx: (0, _selectors.getContext)(state),
    shownSource: getSourceForTree(state, displayedSources, shownSource),
    selectedSource: getSourceForTree(state, displayedSources, selectedSource),
    debuggeeUrl: (0, _selectors.getDebuggeeUrl)(state),
    expanded: (0, _selectors.getExpandedState)(state),
    focused: (0, _selectors.getFocusedSourceItem)(state),
    projectRoot: (0, _selectors.getProjectDirectoryRoot)(state),
    sources: displayedSources,
    sourceCount: Object.values(displayedSources).length
  };
};

exports.default = (0, _connect.connect)(mapStateToProps, {
  selectSource: _actions2.default.selectSource,
  setExpandedState: _actions2.default.setExpandedState,
  focusItem: _actions2.default.focusItem
})(SourcesTree);