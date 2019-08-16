"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParserDispatcher = undefined;

var _devtoolsUtils = require("devtools/client/debugger/dist/vendors").vendored["devtools-utils"];

const { WorkerDispatcher } = _devtoolsUtils.workerUtils; /* This Source Code Form is subject to the terms of the Mozilla Public
                                                          * License, v. 2.0. If a copy of the MPL was not distributed with this
                                                          * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class ParserDispatcher extends WorkerDispatcher {
  async findOutOfScopeLocations(sourceId, position) {
    return this.invoke("findOutOfScopeLocations", sourceId, position);
  }

  async getNextStep(sourceId, pausedPosition) {
    return this.invoke("getNextStep", sourceId, pausedPosition);
  }

  async clearState() {
    return this.invoke("clearState");
  }

  async getScopes(location) {
    return this.invoke("getScopes", location);
  }

  async getSymbols(sourceId) {
    return this.invoke("getSymbols", sourceId);
  }

  async setSource(sourceId, content) {
    const astSource = {
      id: sourceId,
      text: content.type === "wasm" ? "" : content.value,
      contentType: content.contentType || null,
      isWasm: content.type === "wasm"
    };

    return this.invoke("setSource", astSource);
  }

  async hasSyntaxError(input) {
    return this.invoke("hasSyntaxError", input);
  }

  async mapExpression(expression, mappings, bindings, shouldMapBindings, shouldMapAwait) {
    return this.invoke("mapExpression", expression, mappings, bindings, shouldMapBindings, shouldMapAwait);
  }

  async clear() {
    await this.clearState();
  }
}

exports.ParserDispatcher = ParserDispatcher;