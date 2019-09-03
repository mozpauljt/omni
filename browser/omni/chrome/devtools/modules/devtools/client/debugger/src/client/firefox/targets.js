"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateWorkerTargets = updateWorkerTargets;
exports.updateProcessTargets = updateProcessTargets;
exports.updateTargets = updateTargets;
loader.lazyRequireGetter(this, "_events", "devtools/client/debugger/src/client/firefox/events");
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
async function attachTargets(type, targetLists, args) {
  const newTargets = {};
  const targets = args.targets[type] || {};

  for (const targetFront of targetLists) {
    try {
      await targetFront.attach();
      const threadActorID = targetFront.targetForm.threadActor;

      if (targets[threadActorID]) {
        newTargets[threadActorID] = targets[threadActorID];
      } else {
        const [, threadFront] = await targetFront.attachThread(args.options); // NOTE: resume is not necessary for ProcessDescriptors and can be removed
        // once we switch to WorkerDescriptors

        threadFront.resume();
        (0, _events.addThreadEventListeners)(threadFront);
        await targetFront.attachConsole();
        newTargets[threadFront.actor] = targetFront;
      }
    } catch (e) {// If any of the workers have terminated since the list command initiated
      // then we will get errors. Ignore these.
    }
  }

  return newTargets;
}

async function updateWorkerTargets(type, args) {
  const {
    currentTarget
  } = args;

  if (!currentTarget.isBrowsingContext || currentTarget.isContentProcess) {
    return {};
  }

  const {
    workers
  } = await currentTarget.listWorkers();
  return attachTargets(type, workers, args);
}

async function updateProcessTargets(type, args) {
  const {
    currentTarget,
    debuggerClient
  } = args;

  if (!_prefs.prefs.fission || !currentTarget.chrome || currentTarget.isAddon) {
    return Promise.resolve({});
  }

  const {
    processes
  } = await debuggerClient.mainRoot.listProcesses();
  const targets = await Promise.all(processes.filter(descriptor => !descriptor.isParent).map(descriptor => descriptor.getTarget()));
  return attachTargets(type, targets, args);
}

async function updateTargets(type, args) {
  if (type == "worker") {
    return updateWorkerTargets(type, args);
  }

  if (type == "contentProcess") {
    return updateProcessTargets(type, args);
  }

  throw new Error(`Unable to fetch targts for ${type}`);
}