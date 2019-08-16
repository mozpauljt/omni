"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clientEvents = exports.clientCommands = exports.createObjectClient = undefined;
exports.onConnect = onConnect;
loader.lazyRequireGetter(this, "_commands", "devtools/client/debugger/src/client/firefox/commands");
loader.lazyRequireGetter(this, "_events", "devtools/client/debugger/src/client/firefox/events");
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");

let DebuggerClient; /* This Source Code Form is subject to the terms of the Mozilla Public
                     * License, v. 2.0. If a copy of the MPL was not distributed with this
                     * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function createObjectClient(grip) {
  return DebuggerClient.createObjectClient(grip);
}

async function onConnect(connection, actions) {
  const {
    tabConnection: { tabTarget, threadFront, debuggerClient }
  } = connection;

  DebuggerClient = debuggerClient;

  if (!tabTarget || !threadFront || !debuggerClient) {
    return;
  }

  const supportsWasm = _prefs.features.wasm && !!debuggerClient.mainRoot.traits.wasmBinarySource;

  (0, _commands.setupCommands)({
    threadFront,
    tabTarget,
    debuggerClient,
    supportsWasm
  });

  (0, _events.setupEvents)({ threadFront, tabTarget, actions, supportsWasm });

  tabTarget.on("will-navigate", actions.willNavigate);
  tabTarget.on("navigate", actions.navigated);

  await threadFront.reconfigure({
    observeAsmJS: true,
    pauseWorkersUntilAttach: true,
    wasmBinarySource: supportsWasm,
    skipBreakpoints: _prefs.prefs.skipPausing
  });

  // Retrieve possible event listener breakpoints
  actions.getEventListenerBreakpointTypes().catch(e => console.error(e));

  // Initialize the event breakpoints on the thread up front so that
  // they are active once attached.
  actions.addEventListenerBreakpoints([]).catch(e => console.error(e));

  // In Firefox, we need to initially request all of the sources. This
  // usually fires off individual `newSource` notifications as the
  // debugger finds them, but there may be existing sources already in
  // the debugger (if it's paused already, or if loading the page from
  // bfcache) so explicity fire `newSource` events for all returned
  // sources.
  const traits = tabTarget.traits;
  await actions.connect(tabTarget.url, threadFront.actor, traits && traits.canRewind, tabTarget.isWebExtension);

  const fetched = _commands.clientCommands.fetchSources().then(sources => actions.newGeneratedSources(sources));

  // If the threadFront is already paused, make sure to show a
  // paused state.
  const pausedPacket = threadFront.getLastPausePacket();
  if (pausedPacket) {
    _events.clientEvents.paused(threadFront, pausedPacket);
  }

  return fetched;
}

exports.createObjectClient = createObjectClient;
exports.clientCommands = _commands.clientCommands;
exports.clientEvents = _events.clientEvents;