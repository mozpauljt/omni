"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.supportsWorkers = supportsWorkers;
exports.updateWorkerTargets = updateWorkerTargets;
loader.lazyRequireGetter(this, "_events", "devtools/client/debugger/src/client/firefox/events");
function supportsWorkers(tabTarget) {
  return tabTarget.isBrowsingContext || tabTarget.isContentProcess;
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

async function updateWorkerTargets({
  tabTarget,
  debuggerClient,
  threadFront,
  workerTargets,
  options
}) {
  if (!supportsWorkers(tabTarget)) {
    return {};
  }

  const newWorkerTargets = {};

  const { workers } = await tabTarget.listWorkers();
  for (const workerTargetFront of workers) {
    try {
      await workerTargetFront.attach();
      const threadActorID = workerTargetFront._threadActor;
      if (workerTargets[threadActorID]) {
        newWorkerTargets[threadActorID] = workerTargets[threadActorID];
      } else {
        const [, workerThread] = await workerTargetFront.attachThread(options);
        workerThread.resume();

        (0, _events.addThreadEventListeners)(workerThread);

        const consoleFront = await workerTargetFront.getFront("console");
        await consoleFront.startListeners([]);

        newWorkerTargets[workerThread.actor] = workerTargetFront;
      }
    } catch (e) {
      // If any of the workers have terminated since the list command initiated
      // then we will get errors. Ignore these.
    }
  }

  return newWorkerTargets;
}