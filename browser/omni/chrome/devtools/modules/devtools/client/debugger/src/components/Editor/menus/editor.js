"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.editorMenuItems = editorMenuItems;
exports.editorItemActions = editorItemActions;
exports.continueToHereItem = void 0;

var _redux = require("devtools/client/shared/vendor/redux");

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

loader.lazyRequireGetter(this, "_clipboard", "devtools/client/debugger/src/utils/clipboard");
loader.lazyRequireGetter(this, "_source", "devtools/client/debugger/src/utils/source");
loader.lazyRequireGetter(this, "_utils", "devtools/client/debugger/src/utils/utils");
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
loader.lazyRequireGetter(this, "_asyncValue", "devtools/client/debugger/src/utils/async-value");

var _actions = _interopRequireDefault(require("../../../actions/index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
const continueToHereItem = (cx, location, isPaused, editorActions) => ({
  accesskey: L10N.getStr("editor.continueToHere.accesskey"),
  disabled: !isPaused,
  click: () => editorActions.continueToHere(cx, location.line, location.column),
  id: "node-menu-continue-to-here",
  label: L10N.getStr("editor.continueToHere.label")
}); // menu items


exports.continueToHereItem = continueToHereItem;

const copyToClipboardItem = (selectedContent, editorActions) => ({
  id: "node-menu-copy-to-clipboard",
  label: L10N.getStr("copyToClipboard.label"),
  accesskey: L10N.getStr("copyToClipboard.accesskey"),
  disabled: false,
  click: () => selectedContent.type === "text" && (0, _clipboard.copyToTheClipboard)(selectedContent.value)
});

const copySourceItem = (selectedSource, selectionText, editorActions) => ({
  id: "node-menu-copy-source",
  label: L10N.getStr("copySource.label"),
  accesskey: L10N.getStr("copySource.accesskey"),
  disabled: selectionText.length === 0,
  click: () => (0, _clipboard.copyToTheClipboard)(selectionText)
});

const copySourceUri2Item = (selectedSource, editorActions) => ({
  id: "node-menu-copy-source-url",
  label: L10N.getStr("copySourceUri2"),
  accesskey: L10N.getStr("copySourceUri2.accesskey"),
  disabled: !selectedSource.url,
  click: () => (0, _clipboard.copyToTheClipboard)((0, _source.getRawSourceURL)(selectedSource.url))
});

const jumpToMappedLocationItem = (cx, selectedSource, location, hasMappedLocation, editorActions) => ({
  id: "node-menu-jump",
  label: L10N.getFormatStr("editor.jumpToMappedLocation1", (0, _devtoolsSourceMap.isOriginalId)(selectedSource.id) ? L10N.getStr("generated") : L10N.getStr("original")),
  accesskey: L10N.getStr("editor.jumpToMappedLocation1.accesskey"),
  disabled: !hasMappedLocation,
  click: () => editorActions.jumpToMappedLocation(cx, location)
});

const showSourceMenuItem = (cx, selectedSource, editorActions) => ({
  id: "node-menu-show-source",
  label: L10N.getStr("sourceTabs.revealInTree"),
  accesskey: L10N.getStr("sourceTabs.revealInTree.accesskey"),
  disabled: !selectedSource.url,
  click: () => editorActions.showSource(cx, selectedSource.id)
});

const blackBoxMenuItem = (cx, selectedSource, editorActions) => ({
  id: "node-menu-blackbox",
  label: selectedSource.isBlackBoxed ? L10N.getStr("blackboxContextItem.unblackbox") : L10N.getStr("blackboxContextItem.blackbox"),
  accesskey: selectedSource.isBlackBoxed ? L10N.getStr("blackboxContextItem.unblackbox.accesskey") : L10N.getStr("blackboxContextItem.blackbox.accesskey"),
  disabled: !(0, _source.shouldBlackbox)(selectedSource),
  click: () => editorActions.toggleBlackBox(cx, selectedSource)
});

const watchExpressionItem = (cx, selectedSource, selectionText, editorActions) => ({
  id: "node-menu-add-watch-expression",
  label: L10N.getStr("expressions.label"),
  accesskey: L10N.getStr("expressions.accesskey"),
  click: () => editorActions.addExpression(cx, selectionText)
});

const evaluateInConsoleItem = (selectedSource, selectionText, editorActions) => ({
  id: "node-menu-evaluate-in-console",
  label: L10N.getStr("evaluateInConsole.label"),
  click: () => editorActions.evaluateInConsole(selectionText)
});

const downloadFileItem = (selectedSource, selectedContent, editorActions) => ({
  id: "node-menu-download-file",
  label: L10N.getStr("downloadFile.label"),
  accesskey: L10N.getStr("downloadFile.accesskey"),
  click: () => (0, _utils.downloadFile)(selectedContent, (0, _source.getFilename)(selectedSource))
});

const inlinePreviewItem = editorActions => ({
  id: "node-menu-inline-preview",
  label: _prefs.features.inlinePreview ? L10N.getStr("inlinePreview.hide.label") : L10N.getStr("inlinePreview.show.label"),
  click: () => editorActions.toggleInlinePreview(!_prefs.features.inlinePreview)
});

function editorMenuItems({
  cx,
  editorActions,
  selectedSource,
  location,
  selectionText,
  hasMappedLocation,
  isTextSelected,
  isPaused
}) {
  const items = [];
  const content = selectedSource.content && (0, _asyncValue.isFulfilled)(selectedSource.content) ? selectedSource.content.value : null;
  items.push(jumpToMappedLocationItem(cx, selectedSource, location, hasMappedLocation, editorActions), continueToHereItem(cx, location, isPaused, editorActions), {
    type: "separator"
  }, ...(content ? [copyToClipboardItem(content, editorActions)] : []), ...(!selectedSource.isWasm ? [copySourceItem(selectedSource, selectionText, editorActions), copySourceUri2Item(selectedSource, editorActions)] : []), ...(content ? [downloadFileItem(selectedSource, content, editorActions)] : []), {
    type: "separator"
  }, showSourceMenuItem(cx, selectedSource, editorActions), blackBoxMenuItem(cx, selectedSource, editorActions));

  if (isTextSelected) {
    items.push({
      type: "separator"
    }, watchExpressionItem(cx, selectedSource, selectionText, editorActions), evaluateInConsoleItem(selectedSource, selectionText, editorActions));
  }

  items.push({
    type: "separator"
  }, inlinePreviewItem(editorActions));
  return items;
}

function editorItemActions(dispatch) {
  return (0, _redux.bindActionCreators)({
    addExpression: _actions.default.addExpression,
    continueToHere: _actions.default.continueToHere,
    evaluateInConsole: _actions.default.evaluateInConsole,
    flashLineRange: _actions.default.flashLineRange,
    jumpToMappedLocation: _actions.default.jumpToMappedLocation,
    showSource: _actions.default.showSource,
    toggleBlackBox: _actions.default.toggleBlackBox,
    toggleInlinePreview: _actions.default.toggleInlinePreview
  }, dispatch);
}