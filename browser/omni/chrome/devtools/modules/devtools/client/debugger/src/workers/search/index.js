"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findSourceMatches = exports.getMatches = exports.stop = exports.start = void 0;

var _devtoolsUtils = require("devtools/client/debugger/dist/vendors").vendored["devtools-utils"];

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
const {
  WorkerDispatcher
} = _devtoolsUtils.workerUtils;
const dispatcher = new WorkerDispatcher();
const start = dispatcher.start.bind(dispatcher);
exports.start = start;
const stop = dispatcher.stop.bind(dispatcher);
exports.stop = stop;
const getMatches = dispatcher.task("getMatches");
exports.getMatches = getMatches;
const findSourceMatches = dispatcher.task("findSourceMatches");
exports.findSourceMatches = findSourceMatches;