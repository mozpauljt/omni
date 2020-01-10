"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setFramePositions = setFramePositions;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
function setFramePositions(positions, frame, thread) {
  return ({
    dispatch
  }) => {
    dispatch({
      type: "SET_FRAME_POSITIONS",
      positions,
      frame,
      thread
    });
  };
}