/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// CensusTreeNode is an intermediate representation of a census report that
// exists between after a report is generated by taking a census and before the
// report is rendered in the DOM. It must be dead simple to render, with no
// further data processing or massaging needed before rendering DOM nodes. Our
// goal is to do the census report to CensusTreeNode transformation in the
// HeapAnalysesWorker, and ensure that the **only** work that the main thread
// has to do is strictly DOM rendering work.

const {
  Visitor,
  walk,
  basisTotalBytes,
  basisTotalCount,
} = require("resource://devtools/shared/heapsnapshot/CensusUtils.js");

// Monotonically increasing integer for CensusTreeNode `id`s.
let censusTreeNodeIdCounter = 0;

/**
 * Return true if the given object is a SavedFrame stack object, false otherwise.
 *
 * @param {any} obj
 * @returns {Boolean}
 */
function isSavedFrame(obj) {
  return Object.prototype.toString.call(obj) === "[object SavedFrame]";
}

/**
 * A CensusTreeNodeCache maps from SavedFrames to CensusTreeNodes. It is used when
 * aggregating multiple SavedFrame allocation stack keys into a tree of many
 * CensusTreeNodes. Each stack may share older frames, and we want to preserve
 * this sharing when converting to CensusTreeNode, so before creating a new
 * CensusTreeNode, we look for an existing one in one of our CensusTreeNodeCaches.
 */
function CensusTreeNodeCache() {}
CensusTreeNodeCache.prototype = null;

/**
 * The value of a single entry stored in a CensusTreeNodeCache. It is a pair of
 * the CensusTreeNode for this cache value, and the subsequent
 * CensusTreeNodeCache for this node's children.
 *
 * @param {SavedFrame} frame
 *        The frame being cached.
 */
function CensusTreeNodeCacheValue() {
  // The CensusTreeNode for this cache value.
  this.node = undefined;
  // The CensusTreeNodeCache for this frame's children.
  this.children = undefined;
}

CensusTreeNodeCacheValue.prototype = null;

/**
 * Create a unique string for the given SavedFrame (ignoring the frame's parent
 * chain) that can be used as a hash to key this frame within a CensusTreeNodeCache.
 *
 * NB: We manually hash rather than using an ES6 Map because we are purposely
 * ignoring the parent chain and wish to consider frames with everything the
 * same except their parents as the same.
 *
 * @param {SavedFrame} frame
 *        The SavedFrame object we would like to lookup in or insert into a
 *        CensusTreeNodeCache.
 *
 * @returns {String}
 *          The unique string that can be used as a key in a CensusTreeNodeCache.
 */
CensusTreeNodeCache.hashFrame = function(frame) {
  // eslint-disable-next-line max-len
  return `FRAME,${frame.functionDisplayName},${frame.source},${frame.line},${frame.column},${frame.asyncCause}`;
};

/**
 * Create a unique string for the given CensusTreeNode **with regards to
 * siblings at the current depth of the tree, not within the whole tree.** It
 * can be used as a hash to key this node within a CensusTreeNodeCache.
 *
 * @param {CensusTreeNode} node
 *        The node we would like to lookup in or insert into a cache.
 *
 * @returns {String}
 *          The unique string that can be used as a key in a CensusTreeNodeCache.
 */
CensusTreeNodeCache.hashNode = function(node) {
  return isSavedFrame(node.name)
    ? CensusTreeNodeCache.hashFrame(node.name)
    : `NODE,${node.name}`;
};

/**
 * Insert the given CensusTreeNodeCacheValue whose node.name is a SavedFrame
 * object in the given cache.
 *
 * @param {CensusTreeNodeCache} cache
 * @param {CensusTreeNodeCacheValue} value
 */
CensusTreeNodeCache.insertFrame = function(cache, value) {
  cache[CensusTreeNodeCache.hashFrame(value.node.name)] = value;
};

/**
 * Insert the given value in the cache.
 *
 * @param {CensusTreeNodeCache} cache
 * @param {CensusTreeNodeCacheValue} value
 */
CensusTreeNodeCache.insertNode = function(cache, value) {
  if (isSavedFrame(value.node.name)) {
    CensusTreeNodeCache.insertFrame(cache, value);
  } else {
    cache[CensusTreeNodeCache.hashNode(value.node)] = value;
  }
};

/**
 * Lookup `frame` in `cache` and return its value if it exists.
 *
 * @param {CensusTreeNodeCache} cache
 * @param {SavedFrame} frame
 *
 * @returns {undefined|CensusTreeNodeCacheValue}
 */
CensusTreeNodeCache.lookupFrame = function(cache, frame) {
  return cache[CensusTreeNodeCache.hashFrame(frame)];
};

/**
 * Lookup `node` in `cache` and return its value if it exists.
 *
 * @param {CensusTreeNodeCache} cache
 * @param {CensusTreeNode} node
 *
 * @returns {undefined|CensusTreeNodeCacheValue}
 */
CensusTreeNodeCache.lookupNode = function(cache, node) {
  return isSavedFrame(node.name)
    ? CensusTreeNodeCache.lookupFrame(cache, node.name)
    : cache[CensusTreeNodeCache.hashNode(node)];
};

/**
 * Add `child` to `parent`'s set of children and store the parent ID
 * on the child.
 *
 * @param {CensusTreeNode} parent
 * @param {CensusTreeNode} child
 */
function addChild(parent, child) {
  if (!parent.children) {
    parent.children = [];
  }
  child.parent = parent.id;
  parent.children.push(child);
}

/**
 * Get an array of each frame in the provided stack.
 *
 * @param {SavedFrame} stack
 * @returns {Array<SavedFrame>}
 */
function getArrayOfFrames(stack) {
  const frames = [];
  let frame = stack;
  while (frame) {
    frames.push(frame);
    frame = frame.parent;
  }
  frames.reverse();
  return frames;
}

/**
 * Given an `edge` to a sub-`report` whose structure is described by
 * `breakdown`, create a CensusTreeNode tree.
 *
 * @param {Object} breakdown
 *        The breakdown specifying the structure of the given report.
 *
 * @param {Object} report
 *        The census report.
 *
 * @param {null|String|SavedFrame} edge
 *        The edge leading to this report from the parent report.
 *
 * @param {CensusTreeNodeCache} cache
 *        The cache of CensusTreeNodes we have already made for the siblings of
 *        the node being created. The existing nodes are reused when possible.
 *
 * @param {Object} outParams
 *        The return values are attached to this object after this function
 *        returns. Because we create a CensusTreeNode for each frame in a
 *        SavedFrame stack edge, there may multiple nodes per sub-report.
 *
 *          - top: The deepest node in the CensusTreeNode subtree created.
 *
 *          - bottom: The shallowest node in the CensusTreeNode subtree created.
 *                    This is null if the shallowest node in the subtree was
 *                    found in the `cache` and reused.
 *
 *        Note that top and bottom are not necessarily different. In the case
 *        where there is a 1:1 correspondence between an edge in the report and
 *        a CensusTreeNode, top and bottom refer to the same node.
 */
function makeCensusTreeNodeSubTree(breakdown, report, edge, cache, outParams) {
  if (!isSavedFrame(edge)) {
    const node = new CensusTreeNode(edge);
    outParams.top = outParams.bottom = node;
    return;
  }

  const frames = getArrayOfFrames(edge);
  let currentCache = cache;
  let prevNode;
  for (let i = 0, length = frames.length; i < length; i++) {
    const frame = frames[i];

    // Get or create the CensusTreeNodeCacheValue for this frame. If we already
    // have a CensusTreeNodeCacheValue (and hence a CensusTreeNode) for this
    // frame, we don't need to add the node to the previous node's children as
    // we have already done that. If we don't have a CensusTreeNodeCacheValue
    // and CensusTreeNode for this frame, then create one and make sure to hook
    // it up as a child of the previous node.
    let isNewNode = false;
    let val = CensusTreeNodeCache.lookupFrame(currentCache, frame);
    if (!val) {
      isNewNode = true;
      val = new CensusTreeNodeCacheValue();
      val.node = new CensusTreeNode(frame);

      CensusTreeNodeCache.insertFrame(currentCache, val);
      if (prevNode) {
        addChild(prevNode, val.node);
      }
    }

    if (i === 0) {
      outParams.bottom = isNewNode ? val.node : null;
    }
    if (i === length - 1) {
      outParams.top = val.node;
    }

    prevNode = val.node;

    if (i !== length - 1 && !val.children) {
      // This is not the last frame and therefore this node will have
      // children, which we must cache.
      val.children = new CensusTreeNodeCache();
    }

    currentCache = val.children;
  }
}

/**
 * A Visitor that walks a census report and creates the corresponding
 * CensusTreeNode tree.
 */
function CensusTreeNodeVisitor() {
  // The root of the resulting CensusTreeNode tree.
  this._root = null;

  // The stack of CensusTreeNodes that we are in the process of building while
  // walking the census report.
  this._nodeStack = [];

  // To avoid unnecessary allocations, we reuse the same out parameter object
  // passed to `makeCensusTreeNodeSubTree` every time we call it.
  this._outParams = {
    top: null,
    bottom: null,
  };

  // The stack of `CensusTreeNodeCache`s that we use to aggregate many
  // SavedFrame stacks into a single CensusTreeNode tree.
  this._cacheStack = [new CensusTreeNodeCache()];

  // The current index in the DFS of the census report tree.
  this._index = -1;
}

CensusTreeNodeVisitor.prototype = Object.create(Visitor);

/**
 * Create the CensusTreeNode subtree for this sub-report and link it to the
 * parent CensusTreeNode.
 *
 * @overrides Visitor.prototype.enter
 */
CensusTreeNodeVisitor.prototype.enter = function(breakdown, report, edge) {
  this._index++;

  const cache = this._cacheStack[this._cacheStack.length - 1];
  makeCensusTreeNodeSubTree(breakdown, report, edge, cache, this._outParams);
  const { top, bottom } = this._outParams;

  if (!this._root) {
    this._root = bottom;
  } else if (bottom) {
    addChild(this._nodeStack[this._nodeStack.length - 1], bottom);
  }

  this._cacheStack.push(new CensusTreeNodeCache());
  this._nodeStack.push(top);
};

function values(cache) {
  return Object.keys(cache).map(k => cache[k]);
}

function isNonEmpty(node) {
  return (node.children !== undefined && node.children.length)
      || node.bytes !== 0
      || node.count !== 0;
}

/**
 * We have finished adding children to the CensusTreeNode subtree for the
 * current sub-report. Make sure that the children are sorted for every node in
 * the subtree.
 *
 * @overrides Visitor.prototype.exit
 */
CensusTreeNodeVisitor.prototype.exit = function(breakdown, report, edge) {
  // Ensure all children are sorted and have their counts/bytes aggregated. We
  // only need to consider cache children here, because other children
  // correspond to other sub-reports and we already fixed them up in an earlier
  // invocation of `exit`.

  function dfs(node, childrenCache) {
    if (childrenCache) {
      const childValues = values(childrenCache);
      for (let i = 0, length = childValues.length; i < length; i++) {
        dfs(childValues[i].node, childValues[i].children);
      }
    }

    node.totalCount = node.count;
    node.totalBytes = node.bytes;

    if (node.children) {
      // Prune empty leaves.
      node.children = node.children.filter(isNonEmpty);

      node.children.sort(compareByTotal);

      for (let i = 0, length = node.children.length; i < length; i++) {
        node.totalCount += node.children[i].totalCount;
        node.totalBytes += node.children[i].totalBytes;
      }
    }
  }

  const top = this._nodeStack.pop();
  const cache = this._cacheStack.pop();
  dfs(top, cache);
};

/**
 * @overrides Visitor.prototype.count
 */
CensusTreeNodeVisitor.prototype.count = function(breakdown, report, edge) {
  const node = this._nodeStack[this._nodeStack.length - 1];
  node.reportLeafIndex = this._index;

  if (breakdown.count) {
    node.count = report.count;
  }

  if (breakdown.bytes) {
    node.bytes = report.bytes;
  }
};

/**
 * Get the root of the resulting CensusTreeNode tree.
 *
 * @returns {CensusTreeNode}
 */
CensusTreeNodeVisitor.prototype.root = function() {
  if (!this._root) {
    throw new Error("Attempt to get the root before walking the census report!");
  }

  if (this._nodeStack.length) {
    throw new Error("Attempt to get the root while walking the census report!");
  }

  return this._root;
};

/**
 * Create a single, uninitialized CensusTreeNode.
 *
 * @param {null|String|SavedFrame} name
 */
function CensusTreeNode(name) {
  // Display name for this CensusTreeNode. Either null, a string, or a
  // SavedFrame.
  this.name = name;

  // The number of bytes occupied by matching things in the heap snapshot.
  this.bytes = 0;

  // The sum of `this.bytes` and `child.totalBytes` for each child in
  // `this.children`.
  this.totalBytes = 0;

  // The number of things in the heap snapshot that match this node in the
  // census tree.
  this.count = 0;

  // The sum of `this.count` and `child.totalCount` for each child in
  // `this.children`.
  this.totalCount = 0;

  // An array of this node's children, or undefined if it has no children.
  this.children = undefined;

  // The unique ID of this node.
  this.id = ++censusTreeNodeIdCounter;

  // If present, the unique ID of this node's parent. If this node does not have
  // a parent, then undefined.
  this.parent = undefined;

  // The `reportLeafIndex` property allows mapping a CensusTreeNode node back to
  // a leaf in the census report it was generated from. It is always one of the
  // following variants:
  //
  // * A `Number` index pointing a leaf report in a pre-order DFS traversal of
  //   this CensusTreeNode's census report.
  //
  // * A `Set` object containing such indices, when this is part of an inverted
  //   CensusTreeNode tree and multiple leaves in the report map onto this node.
  //
  // * Finally, `undefined` when no leaves in the census report correspond with
  //   this node.
  //
  // The first and third cases are the common cases. The second case is rather
  // uncommon, and to avoid doubling the number of allocations when creating
  // CensusTreeNode trees, and objects that get structured cloned when sending
  // such trees from the HeapAnalysesWorker to the main thread, we only allocate
  // a Set object once a node actually does have multiple leaves it corresponds
  // to.
  this.reportLeafIndex = undefined;
}

CensusTreeNode.prototype = null;

/**
 * Compare the given nodes by their `totalBytes` properties, and breaking ties
 * with the `totalCount`, `bytes`, and `count` properties (in that order).
 *
 * @param {CensusTreeNode} node1
 * @param {CensusTreeNode} node2
 *
 * @returns {Number}
 *          A number suitable for using with Array.prototype.sort.
 */
function compareByTotal(node1, node2) {
  return Math.abs(node2.totalBytes) - Math.abs(node1.totalBytes)
      || Math.abs(node2.totalCount) - Math.abs(node1.totalCount)
      || Math.abs(node2.bytes) - Math.abs(node1.bytes)
      || Math.abs(node2.count) - Math.abs(node1.count);
}

/**
 * Compare the given nodes by their `bytes` properties, and breaking ties with
 * the `count`, `totalBytes`, and `totalCount` properties (in that order).
 *
 * @param {CensusTreeNode} node1
 * @param {CensusTreeNode} node2
 *
 * @returns {Number}
 *          A number suitable for using with Array.prototype.sort.
 */
function compareBySelf(node1, node2) {
  return Math.abs(node2.bytes) - Math.abs(node1.bytes)
      || Math.abs(node2.count) - Math.abs(node1.count)
      || Math.abs(node2.totalBytes) - Math.abs(node1.totalBytes)
      || Math.abs(node2.totalCount) - Math.abs(node1.totalCount);
}

/**
 * Given a parent cache value from a tree we are building and a child node from
 * a tree we are basing the new tree off of, if we already have a corresponding
 * node in the parent's children cache, merge this node's counts with
 * it. Otherwise, create the corresponding node, add it to the parent's children
 * cache, and create the parent->child edge.
 *
 * @param {CensusTreeNodeCacheValue} parentCachevalue
 * @param {CensusTreeNode} node
 *
 * @returns {CensusTreeNodeCacheValue}
 *          The new or extant child node's corresponding cache value.
 */
function insertOrMergeNode(parentCacheValue, node) {
  if (!parentCacheValue.children) {
    parentCacheValue.children = new CensusTreeNodeCache();
  }

  let val = CensusTreeNodeCache.lookupNode(parentCacheValue.children, node);

  if (val) {
    // When inverting, it is possible that multiple leaves in the census report
    // get merged into a single CensusTreeNode node. When this occurs, switch
    // from a single index to a set of indices.
    if (val.node.reportLeafIndex !== undefined &&
        val.node.reportLeafIndex !== node.reportLeafIndex) {
      if (typeof val.node.reportLeafIndex === "number") {
        const oldIndex = val.node.reportLeafIndex;
        val.node.reportLeafIndex = new Set();
        val.node.reportLeafIndex.add(oldIndex);
        val.node.reportLeafIndex.add(node.reportLeafIndex);
      } else {
        val.node.reportLeafIndex.add(node.reportLeafIndex);
      }
    }

    val.node.count += node.count;
    val.node.bytes += node.bytes;
  } else {
    val = new CensusTreeNodeCacheValue();

    val.node = new CensusTreeNode(node.name);
    val.node.reportLeafIndex = node.reportLeafIndex;
    val.node.count = node.count;
    val.node.totalCount = node.totalCount;
    val.node.bytes = node.bytes;
    val.node.totalBytes = node.totalBytes;

    addChild(parentCacheValue.node, val.node);
    CensusTreeNodeCache.insertNode(parentCacheValue.children, val);
  }

  return val;
}

/**
 * Given an un-inverted CensusTreeNode tree, return the corresponding inverted
 * CensusTreeNode tree. The input tree is not modified. The resulting inverted
 * tree is sorted by self bytes rather than by total bytes.
 *
 * @param {CensusTreeNode} tree
 *        The un-inverted tree.
 *
 * @returns {CensusTreeNode}
 *          The corresponding inverted tree.
 */
function invert(tree) {
  const inverted = new CensusTreeNodeCacheValue();
  inverted.node = new CensusTreeNode(null);

  // Do a depth-first search of the un-inverted tree. As we reach each leaf,
  // take the path from the old root to the leaf, reverse that path, and add it
  // to the new, inverted tree's root.

  const path = [];
  (function addInvertedPaths(node) {
    path.push(node);

    if (node.children) {
      for (let i = 0, length = node.children.length; i < length; i++) {
        addInvertedPaths(node.children[i]);
      }
    } else {
      // We found a leaf node, add the reverse path to the inverted tree.
      let currentCacheValue = inverted;
      for (let i = path.length - 1; i >= 0; i--) {
        currentCacheValue = insertOrMergeNode(currentCacheValue, path[i]);
      }
    }

    path.pop();
  }(tree));

  // Ensure that the root node always has the totals.
  inverted.node.totalBytes = tree.totalBytes;
  inverted.node.totalCount = tree.totalCount;

  return inverted.node;
}

/**
 * Given a CensusTreeNode tree and predicate function, create the tree
 * containing only the nodes in any path `(node_0, node_1, ..., node_n-1)` in
 * the given tree where `predicate(node_j)` is true for `0 <= j < n`, `node_0`
 * is the given tree's root, and `node_n-1` is a leaf in the given tree. The
 * given tree is left unmodified.
 *
 * @param {CensusTreeNode} tree
 * @param {Function} predicate
 *
 * @returns {CensusTreeNode}
 */
function filter(tree, predicate) {
  const filtered = new CensusTreeNodeCacheValue();
  filtered.node = new CensusTreeNode(null);

  // Do a DFS over the given tree. If the predicate returns true for any node,
  // add that node and its whole subtree to the filtered tree.

  const path = [];
  let match = false;

  function addMatchingNodes(node) {
    path.push(node);

    const oldMatch = match;
    if (!match && predicate(node)) {
      match = true;
    }

    if (node.children) {
      for (let i = 0, length = node.children.length; i < length; i++) {
        addMatchingNodes(node.children[i]);
      }
    } else if (match) {
      // We found a matching leaf node, add it to the filtered tree.
      let currentCacheValue = filtered;
      for (let i = 0, length = path.length; i < length; i++) {
        currentCacheValue = insertOrMergeNode(currentCacheValue, path[i]);
      }
    }

    match = oldMatch;
    path.pop();
  }

  if (tree.children) {
    for (let i = 0, length = tree.children.length; i < length; i++) {
      addMatchingNodes(tree.children[i]);
    }
  }

  filtered.node.count = tree.count;
  filtered.node.totalCount = tree.totalCount;
  filtered.node.bytes = tree.bytes;
  filtered.node.totalBytes = tree.totalBytes;

  return filtered.node;
}

/**
 * Given a filter string, return a predicate function that takes a node and
 * returns true iff the node matches the filter.
 *
 * @param {String} filterString
 * @returns {Function}
 */
function makeFilterPredicate(filterString) {
  return function(node) {
    if (!node.name) {
      return false;
    }

    if (isSavedFrame(node.name)) {
      return node.name.source.includes(filterString)
        || (node.name.functionDisplayName || "").includes(filterString)
        || (node.name.asyncCause || "").includes(filterString);
    }

    return String(node.name).includes(filterString);
  };
}

/**
 * Takes a report from a census (`dbg.memory.takeCensus()`) and the breakdown
 * used to generate the census and returns a structure used to render
 * a tree to display the data.
 *
 * Returns a recursive "CensusTreeNode" object, looking like:
 *
 * CensusTreeNode = {
 *   // `children` if it exists, is sorted by `bytes`, if they are leaf nodes.
 *   children: ?[<CensusTreeNode...>],
 *   name: <?String>
 *   count: <?Number>
 *   bytes: <?Number>
 *   id: <?Number>
 *   parent: <?Number>
 * }
 *
 * @param {Object} breakdown
 *        The breakdown used to generate the census report.
 *
 * @param {Object} report
 *        The census report generated with the specified breakdown.
 *
 * @param {Object} options
 *        Configuration options.
 *          - invert: Whether to invert the resulting tree or not. Defaults to
 *                    false, ie uninverted.
 *
 * @returns {CensusTreeNode}
 */
exports.censusReportToCensusTreeNode = function(breakdown, report,
                                                 options = {
                                                   invert: false,
                                                   filter: null,
                                                 }) {
  // Reset the counter so that turning the same census report into a
  // CensusTreeNode tree repeatedly is idempotent.
  censusTreeNodeIdCounter = 0;

  const visitor = new CensusTreeNodeVisitor();
  walk(breakdown, report, visitor);
  let result = visitor.root();

  if (options.invert) {
    result = invert(result);
  }

  if (typeof options.filter === "string") {
    result = filter(result, makeFilterPredicate(options.filter));
  }

  // If the report is a delta report that was generated by diffing two other
  // reports, make sure to use the basis totals rather than the totals of the
  // difference.
  if (typeof report[basisTotalBytes] === "number") {
    result.totalBytes = report[basisTotalBytes];
    result.totalCount = report[basisTotalCount];
  }

  // Inverting and filtering could have messed up the sort order, so do a
  // depth-first search of the tree and ensure that siblings are sorted.
  const comparator = options.invert ? compareBySelf : compareByTotal;
  (function ensureSorted(node) {
    if (node.children) {
      node.children.sort(comparator);
      for (let i = 0, length = node.children.length; i < length; i++) {
        ensureSorted(node.children[i]);
      }
    }
  }(result));

  return result;
};
