"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateFrameLocation = updateFrameLocation;
exports.mapDisplayNames = mapDisplayNames;
exports.mapFrames = mapFrames;
loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

var _assert = _interopRequireDefault(require("../../utils/assert"));

loader.lazyRequireGetter(this, "_ast", "devtools/client/debugger/src/utils/ast");
loader.lazyRequireGetter(this, "_symbols", "devtools/client/debugger/src/actions/sources/symbols");

var _devtoolsSourceMap = _interopRequireWildcard(require("devtools/client/shared/source-map/index.js"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
function isFrameBlackboxed(state, frame) {
  const source = (0, _selectors.getSource)(state, frame.location.sourceId);
  return source && source.isBlackBoxed;
}

function getSelectedFrameId(state, thread, frames) {
  let selectedFrame = (0, _selectors.getSelectedFrame)(state, thread);

  if (selectedFrame && !isFrameBlackboxed(state, selectedFrame)) {
    return selectedFrame.id;
  }

  selectedFrame = frames.find(frame => !isFrameBlackboxed(state, frame));
  return selectedFrame && selectedFrame.id;
}

function updateFrameLocation(frame, sourceMaps) {
  if (frame.isOriginal) {
    return Promise.resolve(frame);
  }

  return sourceMaps.getOriginalLocation(frame.location).then(loc => ({ ...frame,
    location: loc,
    generatedLocation: frame.generatedLocation || frame.location
  }));
}

function updateFrameLocations(frames, sourceMaps) {
  if (!frames || frames.length == 0) {
    return Promise.resolve(frames);
  }

  return Promise.all(frames.map(frame => updateFrameLocation(frame, sourceMaps)));
}

function mapDisplayNames(frames, getState) {
  return frames.map(frame => {
    if (frame.isOriginal) {
      return frame;
    }

    const source = (0, _selectors.getSource)(getState(), frame.location.sourceId);

    if (!source) {
      return frame;
    }

    const symbols = (0, _selectors.getSymbols)(getState(), source);

    if (!symbols || !symbols.functions) {
      return frame;
    }

    const originalFunction = (0, _ast.findClosestFunction)(symbols, frame.location);

    if (!originalFunction) {
      return frame;
    }

    const originalDisplayName = originalFunction.name;
    return { ...frame,
      originalDisplayName
    };
  });
}

function isWasmOriginalSourceFrame(frame, getState) {
  if ((0, _devtoolsSourceMap.isGeneratedId)(frame.location.sourceId)) {
    return false;
  }

  const generatedSource = (0, _selectors.getSource)(getState(), frame.generatedLocation.sourceId);
  return Boolean(generatedSource && generatedSource.isWasm);
}

async function expandFrames(frames, sourceMaps, getState) {
  const result = [];

  for (let i = 0; i < frames.length; ++i) {
    const frame = frames[i];

    if (frame.isOriginal || !isWasmOriginalSourceFrame(frame, getState)) {
      result.push(frame);
      continue;
    }

    const originalFrames = await sourceMaps.getOriginalStackFrames(frame.generatedLocation);

    if (!originalFrames) {
      result.push(frame);
      continue;
    }

    (0, _assert.default)(originalFrames.length > 0, "Expected at least one original frame"); // First entry has not specific location -- use one from original frame.

    originalFrames[0] = { ...originalFrames[0],
      location: frame.location
    };
    originalFrames.forEach((originalFrame, j) => {
      if (!originalFrame.location) {
        return;
      } // Keep outer most frame with true actor ID, and generate uniquie
      // one for the nested frames.


      const id = j == 0 ? frame.id : `${frame.id}-originalFrame${j}`;
      result.push({
        id,
        displayName: originalFrame.displayName,
        location: originalFrame.location,
        source: null,
        thread: frame.thread,
        scope: frame.scope,
        this: frame.this,
        isOriginal: true,
        // More fields that will be added by the mapDisplayNames and
        // updateFrameLocation.
        generatedLocation: frame.generatedLocation,
        originalDisplayName: originalFrame.displayName,
        originalVariables: originalFrame.variables
      });
    });
  }

  return result;
}

async function updateFrameSymbols(cx, frames, {
  dispatch,
  getState
}) {
  await Promise.all(frames.map(frame => {
    const source = (0, _selectors.getSourceFromId)(getState(), frame.location.sourceId);
    return dispatch((0, _symbols.setSymbols)({
      cx,
      source
    }));
  }));
}
/**
 * Map call stack frame locations and display names to originals.
 * e.g.
 * 1. When the debuggee pauses
 * 2. When a source is pretty printed
 * 3. When symbols are loaded
 * @memberof actions/pause
 * @static
 */


function mapFrames(cx) {
  return async function (thunkArgs) {
    const {
      dispatch,
      getState,
      sourceMaps
    } = thunkArgs;
    const frames = (0, _selectors.getFrames)(getState(), cx.thread);

    if (!frames) {
      return;
    }

    let mappedFrames = await updateFrameLocations(frames, sourceMaps);
    await updateFrameSymbols(cx, mappedFrames, thunkArgs);
    mappedFrames = await expandFrames(mappedFrames, sourceMaps, getState);
    mappedFrames = mapDisplayNames(mappedFrames, getState);
    const selectedFrameId = getSelectedFrameId(getState(), cx.thread, mappedFrames);
    dispatch({
      type: "MAP_FRAMES",
      cx,
      thread: cx.thread,
      frames: mappedFrames,
      selectedFrameId
    });
  };
}