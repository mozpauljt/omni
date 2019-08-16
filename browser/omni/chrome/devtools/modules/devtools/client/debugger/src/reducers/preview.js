"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialPreviewState = initialPreviewState;
exports.getPreview = getPreview;
exports.getPreviewCount = getPreviewCount;
function initialPreviewState() {
  return {
    preview: null,
    previewCount: 0
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function update(state = initialPreviewState(), action) {
  switch (action.type) {
    case "CLEAR_PREVIEW":
      {
        return { ...state, preview: null };
      }

    case "START_PREVIEW":
      {
        return { ...state, previewCount: state.previewCount + 1 };
      }

    case "SET_PREVIEW":
      {
        return { ...state, preview: action.value };
      }
  }

  return state;
}

// NOTE: we'd like to have the app state fully typed
// https://github.com/firefox-devtools/debugger/blob/master/src/reducers/sources.js#L179-L185
function getPreview(state) {
  return state.preview.preview;
}

function getPreviewCount(state) {
  return state.preview.previewCount;
}

exports.default = update;