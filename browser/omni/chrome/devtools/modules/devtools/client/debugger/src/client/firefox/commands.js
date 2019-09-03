"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupCommands = setupCommands;
exports.clientCommands = void 0;
loader.lazyRequireGetter(this, "_create", "devtools/client/debugger/src/client/firefox/create");
loader.lazyRequireGetter(this, "_targets", "devtools/client/debugger/src/client/firefox/targets");

var _devtoolsReps = _interopRequireDefault(require("devtools/client/shared/components/reps/reps.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
let targets;
let currentThreadFront;
let currentTarget;
let debuggerClient;
let sourceActors;
let breakpoints;
let eventBreakpoints;
let supportsWasm;

function setupCommands(dependencies) {
  currentThreadFront = dependencies.threadFront;
  currentTarget = dependencies.tabTarget;
  debuggerClient = dependencies.debuggerClient;
  supportsWasm = dependencies.supportsWasm;
  targets = {
    worker: {},
    contentProcess: {}
  };
  sourceActors = {};
  breakpoints = {};
}

function hasWasmSupport() {
  return supportsWasm;
}

function createObjectClient(grip) {
  return debuggerClient.createObjectClient(grip);
}

async function loadObjectProperties(root) {
  const utils = _devtoolsReps.default.objectInspector.utils;
  const properties = await utils.loadProperties.loadItemProperties(root, createObjectClient);
  return utils.node.getChildren({
    item: root,
    loadedProperties: new Map([[root.path, properties]])
  });
}

function releaseActor(actor) {
  if (!actor) {
    return;
  }

  return debuggerClient.release(actor);
}

function sendPacket(packet) {
  return debuggerClient.request(packet);
} // Transforms targets from {[ThreadType]: TargetMap} to TargetMap


function getTargetsMap() {
  return Object.assign({}, ...Object.values(targets));
}

function lookupTarget(thread) {
  if (thread == currentThreadFront.actor) {
    return currentTarget;
  }

  const targetsMap = getTargetsMap();

  if (!targetsMap[thread]) {
    throw new Error(`Unknown thread front: ${thread}`);
  }

  return targetsMap[thread];
}

function lookupThreadFront(thread) {
  const target = lookupTarget(thread);
  return target.threadFront;
}

function listThreadFronts() {
  const targetList = Object.values(getTargetsMap());
  return targetList.map(target => target.threadFront);
}

function forEachThread(iteratee) {
  // We have to be careful here to atomically initiate the operation on every
  // thread, with no intervening await. Otherwise, other code could run and
  // trigger additional thread operations. Requests on server threads will
  // resolve in FIFO order, and this could result in client and server state
  // going out of sync.
  const promises = [currentThreadFront, ...listThreadFronts()].map( // If a thread shuts down while sending the message then it will
  // throw. Ignore these exceptions.
  t => iteratee(t).catch(e => console.log(e)));
  return Promise.all(promises);
}

function resume(thread) {
  return lookupThreadFront(thread).resume();
}

function stepIn(thread) {
  return lookupThreadFront(thread).stepIn();
}

function stepOver(thread) {
  return lookupThreadFront(thread).stepOver();
}

function stepOut(thread) {
  return lookupThreadFront(thread).stepOut();
}

function rewind(thread) {
  return lookupThreadFront(thread).rewind();
}

function reverseStepOver(thread) {
  return lookupThreadFront(thread).reverseStepOver();
}

function breakOnNext(thread) {
  return lookupThreadFront(thread).breakOnNext();
}

async function sourceContents({
  actor,
  thread
}) {
  const sourceThreadFront = lookupThreadFront(thread);
  const sourceFront = sourceThreadFront.source({
    actor
  });
  const {
    source,
    contentType
  } = await sourceFront.source();
  return {
    source,
    contentType
  };
}

function setXHRBreakpoint(path, method) {
  return currentThreadFront.setXHRBreakpoint(path, method);
}

function removeXHRBreakpoint(path, method) {
  return currentThreadFront.removeXHRBreakpoint(path, method);
} // Get the string key to use for a breakpoint location.
// See also duplicate code in breakpoint-actor-map.js :(


function locationKey(location) {
  const {
    sourceUrl,
    line,
    column
  } = location;
  const sourceId = location.sourceId || ""; // $FlowIgnore

  return `${sourceUrl}:${sourceId}:${line}:${column}`;
}

function detachWorkers() {
  for (const thread of listThreadFronts()) {
    thread.detach();
  }
}

function maybeGenerateLogGroupId(options) {
  if (options.logValue && currentTarget.traits && currentTarget.traits.canRewind) {
    return { ...options,
      logGroupId: `logGroup-${Math.random()}`
    };
  }

  return options;
}

function maybeClearLogpoint(location) {
  const bp = breakpoints[locationKey(location)];

  if (bp && bp.options.logGroupId && currentTarget.activeConsole) {
    currentTarget.activeConsole.emit("clearLogpointMessages", bp.options.logGroupId);
  }
}

function hasBreakpoint(location) {
  return !!breakpoints[locationKey(location)];
}

function setBreakpoint(location, options) {
  maybeClearLogpoint(location);
  options = maybeGenerateLogGroupId(options);
  breakpoints[locationKey(location)] = {
    location,
    options
  };
  return forEachThread(thread => thread.setBreakpoint(location, options));
}

function removeBreakpoint(location) {
  maybeClearLogpoint(location);
  delete breakpoints[locationKey(location)];
  return forEachThread(thread => thread.removeBreakpoint(location));
}

async function evaluateInFrame(script, options) {
  return evaluate(script, options);
}

async function evaluateExpressions(scripts, options) {
  return Promise.all(scripts.map(script => evaluate(script, options)));
}

function evaluate(script, {
  thread,
  frameId
} = {}) {
  const params = {
    thread,
    frameActor: frameId
  };

  if (!currentTarget || !script) {
    return Promise.resolve({
      result: null
    });
  }

  const target = thread ? lookupTarget(thread) : currentTarget;
  const console = target.activeConsole;

  if (!console) {
    return Promise.resolve({
      result: null
    });
  }

  return console.evaluateJSAsync(script, params);
}

function autocomplete(input, cursor, frameId) {
  if (!currentTarget || !currentTarget.activeConsole || !input) {
    return Promise.resolve({});
  }

  return new Promise(resolve => {
    currentTarget.activeConsole.autocomplete(input, cursor, result => resolve(result), frameId);
  });
}

function navigate(url) {
  return currentTarget.navigateTo({
    url
  });
}

function reload() {
  return currentTarget.reload();
}

function getProperties(thread, grip) {
  const objClient = lookupThreadFront(thread).pauseGrip(grip);
  return objClient.getPrototypeAndProperties().then(resp => {
    const {
      ownProperties,
      safeGetterValues
    } = resp;

    for (const name in safeGetterValues) {
      const {
        enumerable,
        writable,
        getterValue
      } = safeGetterValues[name];
      ownProperties[name] = {
        enumerable,
        writable,
        value: getterValue
      };
    }

    return resp;
  });
}

async function getFrameScopes(frame) {
  if (frame.scope) {
    return frame.scope;
  }

  const sourceThreadFront = lookupThreadFront(frame.thread);
  return sourceThreadFront.getEnvironment(frame.id);
}

function pauseOnExceptions(shouldPauseOnExceptions, shouldPauseOnCaughtExceptions) {
  return forEachThread(thread => thread.pauseOnExceptions(shouldPauseOnExceptions, // Providing opposite value because server
  // uses "shouldIgnoreCaughtExceptions"
  !shouldPauseOnCaughtExceptions));
}

async function blackBox(sourceActor, isBlackBoxed, range) {
  const sourceFront = currentThreadFront.source({
    actor: sourceActor.actor
  });

  if (isBlackBoxed) {
    await sourceFront.unblackBox(range);
  } else {
    await sourceFront.blackBox(range);
  }
}

function setSkipPausing(shouldSkip) {
  return forEachThread(thread => thread.skipBreakpoints(shouldSkip));
}

function interrupt(thread) {
  return lookupThreadFront(thread).interrupt();
}

function setEventListenerBreakpoints(ids) {
  eventBreakpoints = ids;
  return forEachThread(thread => thread.setActiveEventBreakpoints(ids));
} // eslint-disable-next-line


async function getEventListenerBreakpointTypes() {
  let categories;

  try {
    categories = await currentThreadFront.getAvailableEventBreakpoints();

    if (!Array.isArray(categories)) {
      // When connecting to older browser that had our placeholder
      // implementation of the 'getAvailableEventBreakpoints' endpoint, we
      // actually get back an object with a 'value' property containing
      // the categories. Since that endpoint wasn't actually backed with a
      // functional implementation, we just bail here instead of storing the
      // 'value' property into the categories.
      categories = null;
    }
  } catch (err) {// Event bps aren't supported on this firefox version.
  }

  return categories || [];
}

function pauseGrip(thread, func) {
  return lookupThreadFront(thread).pauseGrip(func);
}

function registerSourceActor(sourceActorId, sourceId) {
  sourceActors[sourceActorId] = sourceId;
}

async function getSources(client) {
  const {
    sources
  } = await client.getSources();
  return sources.map(source => (0, _create.prepareSourcePayload)(client, source));
}

async function fetchSources() {
  return getSources(currentThreadFront);
}

function getSourceForActor(actor) {
  if (!sourceActors[actor]) {
    throw new Error(`Unknown source actor: ${actor}`);
  }

  return sourceActors[actor];
}

async function fetchThreads(type) {
  if (!type) {
    const workers = await updateThreads("worker");
    const processes = await updateThreads("contentProcess");
    return [...workers, ...processes];
  }

  return updateThreads(type);
}

async function updateThreads(type) {
  const options = {
    breakpoints,
    eventBreakpoints,
    observeAsmJS: true
  };
  const newTargets = await (0, _targets.updateTargets)(type, {
    currentTarget,
    debuggerClient,
    targets,
    options
  }); // Fetch the sources and install breakpoints on any new workers.
  // NOTE: This runs in the background and fails quitely because it is
  // pretty easy for sources to throw during the fetch if their thread
  // shuts down, which would cause test failures.

  for (const actor in newTargets) {
    if (!targets[type][actor]) {
      const {
        threadFront
      } = newTargets[actor];
      getSources(threadFront).catch(e => console.error(e));
    }
  }

  targets = { ...targets,
    [type]: newTargets
  };
  return Object.keys(newTargets).map(actor => (0, _create.createThread)(actor, newTargets[actor]));
}

function getMainThread() {
  return currentThreadFront.actor;
}

async function getSourceActorBreakpointPositions({
  thread,
  actor
}, range) {
  const sourceThreadFront = lookupThreadFront(thread);
  const sourceFront = sourceThreadFront.source({
    actor
  });
  return sourceFront.getBreakpointPositionsCompressed(range);
}

async function getSourceActorBreakableLines({
  thread,
  actor
}) {
  const sourceThreadFront = lookupThreadFront(thread);
  const sourceFront = sourceThreadFront.source({
    actor
  });
  let actorLines = [];

  try {
    actorLines = await sourceFront.getBreakableLines();
  } catch (e) {
    // Handle backward compatibility
    if (e.message && e.message.match(/does not recognize the packet type getBreakableLines/)) {
      const pos = await sourceFront.getBreakpointPositionsCompressed();
      actorLines = Object.keys(pos).map(line => Number(line));
    } else if (!e.message || !e.message.match(/Connection closed/)) {
      throw e;
    }
  }

  return actorLines;
}

const clientCommands = {
  autocomplete,
  blackBox,
  createObjectClient,
  loadObjectProperties,
  releaseActor,
  interrupt,
  pauseGrip,
  resume,
  stepIn,
  stepOut,
  stepOver,
  rewind,
  reverseStepOver,
  breakOnNext,
  sourceContents,
  getSourceForActor,
  getSourceActorBreakpointPositions,
  getSourceActorBreakableLines,
  hasBreakpoint,
  setBreakpoint,
  setXHRBreakpoint,
  removeXHRBreakpoint,
  removeBreakpoint,
  evaluate,
  evaluateInFrame,
  evaluateExpressions,
  navigate,
  reload,
  getProperties,
  getFrameScopes,
  pauseOnExceptions,
  fetchSources,
  registerSourceActor,
  fetchThreads,
  getMainThread,
  sendPacket,
  setSkipPausing,
  setEventListenerBreakpoints,
  getEventListenerBreakpointTypes,
  detachWorkers,
  hasWasmSupport,
  lookupTarget
};
exports.clientCommands = clientCommands;