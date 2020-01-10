/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* eslint-disable spaced-comment, brace-style, indent-legacy, consistent-return */

"use strict";

// Normally, the server Inspector code inspects the DOM in the process it is
// running in. When inspecting a replaying process, the DOM is in the replaying
// process itself instead of the middleman process where server code runs.
//
// To allow the same server code to work in both cases, while replaying we make
// the following changes, which are managed here:
//
// - Objects in the replaying process are represented by proxies in the
//   middleman process, which are provided to the server code and can be
//   accessed in the same way that normal DOM objects are.
//
// - Global bindings accessing C++ interfaces that expect DOM objects from the
//   current process are replaced with interfaces that operate on the
//   replaying object proxies.

const ReplayDebugger = require("devtools/server/actors/replay/debugger");

let _dbg = null;
function dbg() {
  if (!_dbg) {
    _dbg = new ReplayDebugger();
  }
  return _dbg;
}

function dbgObject(id) {
  return dbg()._pool.getObject(id);
}

///////////////////////////////////////////////////////////////////////////////
// Public Interface
///////////////////////////////////////////////////////////////////////////////

let gInspectorUtils;

const ReplayInspector = {
  // Return a proxy for the window in the replaying process.
  get window() {
    if (!gFixedProxy.window) {
      updateFixedProxies();
    }
    return gFixedProxy.window;
  },

  // Create the InspectorUtils object to bind for other server users.
  createInspectorUtils(utils) {
    gInspectorUtils = new Proxy(
      {},
      {
        get(_, name) {
          switch (name) {
            case "getAllStyleSheets":
            case "getContentState":
            case "getCSSStyleRules":
            case "getRuleLine":
            case "getRuleColumn":
            case "getRelativeRuleLine":
            case "getSelectorCount":
            case "getSelectorText":
            case "selectorMatchesElement":
            case "hasRulesModifiedByCSSOM":
            case "getSpecificity":
              return gFixedProxy.InspectorUtils[name];
            case "hasPseudoClassLock":
              return () => false;
            default:
              return utils[name];
          }
        },
      }
    );
    return gInspectorUtils;
  },

  wrapRequireHook(requireHook) {
    return (id, require) => {
      const rv = requireHook(id, require);
      return substituteRequire(id, rv);
    };
  },

  // Find the element in the replaying process which is being targeted by a
  // mouse event in the middleman process.
  findEventTarget(event) {
    const rv = dbg()._sendRequestAllowDiverge({
      type: "findEventTarget",
      clientX: event.clientX,
      clientY: event.clientY,
    });
    const obj = dbgObject(rv.id);
    return wrapValue(obj);
  },

  // Get the ReplayDebugger.Object underlying a replaying object proxy.
  getDebuggerObject(node) {
    return unwrapValue(node);
  },

  // For use by ReplayDebugger.
  wrapObject,
  unwrapObject(obj) {
    return proxyMap.get(obj);
  },
};

// Objects we need to override isInstance for.
const gOverrideIsInstance = ["CSSRule", "Event"];

for (const name of gOverrideIsInstance) {
  ReplayInspector[`create${name}`] = original => ({
    ...original,
    isInstance(obj) {
      const unwrapped = proxyMap.get(obj);
      if (!unwrapped) {
        return original.isInstance(obj);
      }
      assert(unwrapped instanceof ReplayDebugger.Object);
      return unwrapped.replayIsInstance(name);
    },
  });
}

///////////////////////////////////////////////////////////////////////////////
// Require Substitutions
///////////////////////////////////////////////////////////////////////////////

// Server code in this process can try to interact with our replaying object
// proxies using various chrome interfaces. We swap these out for our own
// equivalent implementations so that things work smoothly.

function newSubstituteProxy(target, mapping) {
  return new Proxy(
    {},
    {
      get(_, name) {
        if (mapping[name]) {
          return mapping[name];
        }
        return target[name];
      },
    }
  );
}

function createSubstituteChrome(chrome) {
  const { Cc, Cu } = chrome;
  return {
    ...chrome,
    Cc: newSubstituteProxy(Cc, {
      "@mozilla.org/inspector/deep-tree-walker;1": {
        createInstance() {
          // Return a proxy for a new tree walker in the replaying process.
          const data = dbg()._sendRequestAllowDiverge({
            type: "newDeepTreeWalker",
          });
          const obj = dbgObject(data.id);
          return wrapObject(obj);
        },
      },
    }),
    Cu: newSubstituteProxy(Cu, {
      isDeadWrapper(node) {
        let unwrapped = proxyMap.get(node);
        if (!unwrapped) {
          return Cu.isDeadWrapper(node);
        }
        assert(unwrapped instanceof ReplayDebugger.Object);

        // Objects are considered dead if we have unpaused since creating them
        // and they are not one of the fixed proxies. This prevents the
        // inspector from trying to continue using them.
        if (unwrapped._pool != dbg()._pool) {
          updateFixedProxies();
          unwrapped = proxyMap.get(node);
          return unwrapped._pool != dbg()._pool;
        }
        return false;
      },
    }),
  };
}

function createSubstituteServices(Services) {
  return newSubstituteProxy(Services, {
    els: {
      getListenerInfoFor(node) {
        return gFixedProxy.Services.els.getListenerInfoFor(node);
      },
    },
  });
}

function createSubstitute(id, rv) {
  switch (id) {
    case "chrome":
      return createSubstituteChrome(rv);
    case "Services":
      return createSubstituteServices(rv);
  }
  return null;
}

const substitutes = new Map();

function substituteRequire(id, rv) {
  if (substitutes.has(id)) {
    return substitutes.get(id) || rv;
  }
  const newrv = createSubstitute(id, rv);
  substitutes.set(id, newrv);
  return newrv || rv;
}

///////////////////////////////////////////////////////////////////////////////
// Replaying Object Proxies
///////////////////////////////////////////////////////////////////////////////

// Map from replaying object proxies to the underlying Debugger.Object.
const proxyMap = new Map();

// Create an array with the contents of obj.
function createArrayObject(obj) {
  const target = [];
  for (const name of obj.getOwnPropertyNames()) {
    const desc = obj.getOwnPropertyDescriptor(name);
    if (desc && "value" in desc) {
      target[name] = wrapValue(desc.value);
    }
  }
  return target;
}

function createInspectorObject(obj) {
  if (obj.class == "Array") {
    // Eagerly create an array in this process which supports calls to map() and
    // so forth without needing to send callbacks to the replaying process.
    return createArrayObject(obj);
  }

  let target;
  if (obj.callable) {
    // Proxies need callable targets in order to be callable themselves.
    target = function() {};
    target.object = obj;
  } else {
    // Place non-callable targets in a box as well, so that we can change the
    // underlying ReplayDebugger.Object later.
    target = { object: obj };
  }
  const proxy = new Proxy(target, ReplayInspectorProxyHandler);

  proxyMap.set(proxy, obj);
  return proxy;
}

function wrapObject(obj) {
  assert(obj instanceof ReplayDebugger.Object);
  if (!obj._inspectorObject) {
    obj._inspectorObject = createInspectorObject(obj);
  }
  return obj._inspectorObject;
}

function wrapValue(value) {
  if (value && typeof value == "object") {
    return wrapObject(value);
  }
  return value;
}

function unwrapValue(value) {
  if (!isNonNullObject(value)) {
    return value;
  }

  const obj = proxyMap.get(value);
  if (obj) {
    return obj;
  }

  if (value == gInspectorUtils) {
    return proxyMap.get(gFixedProxy.InspectorUtils);
  }

  if (value instanceof Object) {
    const rv = dbg()._sendRequest({ type: "createObject" });
    const newobj = dbgObject(rv.id);

    Object.entries(value).forEach(([name, propvalue]) => {
      const unwrapped = unwrapValue(propvalue);
      setObjectProperty(newobj, name, unwrapped);
    });
    return newobj;
  }

  ThrowError("Can't unwrap value");
}

function getObjectProperty(obj, name) {
  assert(obj._pool == dbg()._pool);
  const rv = dbg()._sendRequestAllowDiverge({
    type: "getObjectPropertyValue",
    id: obj._data.id,
    name,
  });
  return dbg()._pool.convertCompletionValue(rv);
}

function ignoreSetProperty(obj, name) {
  switch (obj.class) {
    case "HTMLDocument":
      return ["styleSheetChangeEventsEnabled"].includes(name);
  }
  return false;
}

function setObjectProperty(obj, name, value) {
  assert(obj._pool == dbg()._pool);
  const rv = dbg()._sendRequestAllowDiverge({
    type: "setObjectPropertyValue",
    id: obj._data.id,
    name,
    value: dbg()._convertValueForChild(value),
  });
  return dbg()._pool.convertCompletionValue(rv);
}

function getTargetObject(target) {
  if (!target.object._data) {
    // This should be a fixed proxy (window or window.document), in which case
    // we briefly pause and update the proxy according to its current contents.
    // Other proxies should not be used again after the replaying process
    // unpauses: when repausing the client should regenerate the entire DOM.
    updateFixedProxies();
    assert(target.object._data);
  }
  return target.object;
}

const ReplayInspectorProxyHandler = {
  getPrototypeOf(target) {
    target = getTargetObject(target);

    // Cherry pick some objects that are used in instanceof comparisons by
    // server inspector code.
    if (target._data.class == "NamedNodeMap") {
      return NamedNodeMap.prototype;
    }

    return null;
  },

  has(target, name) {
    target = getTargetObject(target);

    if (typeof name == "symbol") {
      return name == Symbol.iterator;
    }

    if (name == "toString") {
      return true;
    }

    // See if this is an 'own' data property.
    const desc = target.getOwnPropertyDescriptor(name);
    return !!desc;
  },

  get(target, name, receiver) {
    target = getTargetObject(target);

    if (typeof name == "symbol") {
      if (name == Symbol.iterator) {
        const array = createArrayObject(target);
        return array[Symbol.iterator];
      }

      return undefined;
    }

    if (name == "toString") {
      return () => `ReplayInspectorProxy #${target._data.id}`;
    }

    // See if this is an 'own' data property.
    if (!target._modifiedProperties || !target._modifiedProperties.has(name)) {
      const desc = target.getOwnPropertyDescriptor(name);
      if (desc && "value" in desc) {
        return wrapValue(desc.value);
      }
    }

    // Get the property on the target object directly in the replaying process.
    const rv = getObjectProperty(target, name);
    if ("return" in rv) {
      return wrapValue(rv.return);
    }
    ThrowError(rv.throw);
  },

  set(target, name, value) {
    target = getTargetObject(target);

    if (ignoreSetProperty(target, name)) {
      return true;
    }

    if (!target._modifiedProperties) {
      target._modifiedProperties = new Set();
    }
    target._modifiedProperties.add(name);

    const rv = setObjectProperty(target, name, unwrapValue(value));
    if ("return" in rv) {
      return true;
    }
    ThrowError(rv.throw);
  },

  apply(target, thisArg, args) {
    target = getTargetObject(target);

    const rv = target.apply(
      unwrapValue(thisArg),
      args.map(v => unwrapValue(v))
    );
    if ("return" in rv) {
      return wrapValue(rv.return);
    }
    ThrowError(rv.throw);
  },

  construct(target, args) {
    target = getTargetObject(target);
    const proxy = wrapObject(target);

    // Create fake MutationObservers to satisfy callers in the inspector.
    if (proxy == gFixedProxy.window.MutationObserver) {
      return {
        observe: () => {},
        disconnect: () => {},
      };
    }

    NotAllowed();
  },

  getOwnPropertyDescriptor(target, name) {
    target = getTargetObject(target);

    const desc = target.getOwnPropertyDescriptor(name);
    if (!desc) {
      return null;
    }

    // Note: ReplayDebugger.Object.getOwnPropertyDescriptor always returns a
    // fresh object, so we can modify it in place.
    if ("value" in desc) {
      desc.value = wrapValue(desc.value);
    }
    if ("get" in desc) {
      desc.get = wrapValue(desc.get);
    }
    if ("set" in desc) {
      desc.set = wrapValue(desc.set);
    }
    desc.configurable = true;
    return desc;
  },

  ownKeys(target) {
    target = getTargetObject(target);
    return target.getOwnPropertyNames();
  },

  isExtensible(target) {
    NYI();
  },

  setPrototypeOf() {
    NotAllowed();
  },
  preventExtensions() {
    NotAllowed();
  },
  defineProperty() {
    NotAllowed();
  },
  deleteProperty() {
    NotAllowed();
  },
};

///////////////////////////////////////////////////////////////////////////////
// Fixed Proxies
///////////////////////////////////////////////////////////////////////////////

// Proxies for the window and root document are reused to ensure consistent
// actors are used for these objects.
const gFixedProxyTargets = {};
const gFixedProxy = {};

function initFixedProxy(proxy, target, obj) {
  target.object = obj;
  proxyMap.set(proxy, obj);
  obj._inspectorObject = proxy;
}

function updateFixedProxies() {
  dbg()._ensurePaused();

  const { objects, preview } = dbg()._sendRequestAllowDiverge({
    type: "getFixedObjects",
  });
  dbg()._pool.addPauseData(preview);
  for (const [key, value] of Object.entries(objects)) {
    if (!gFixedProxyTargets[key]) {
      gFixedProxyTargets[key] = { object: {} };
      gFixedProxy[key] = new Proxy(
        gFixedProxyTargets[key],
        ReplayInspectorProxyHandler
      );
    }
    initFixedProxy(gFixedProxy[key], gFixedProxyTargets[key], dbgObject(value));
  }
}

///////////////////////////////////////////////////////////////////////////////
// Utilities
///////////////////////////////////////////////////////////////////////////////

function NYI() {
  ThrowError("Not yet implemented");
}

function NotAllowed() {
  ThrowError("Not allowed");
}

function ThrowError(msg) {
  const error = new Error(msg);
  dump(
    "ReplayInspector Server Error: " + msg + " Stack: " + error.stack + "\n"
  );
  throw error;
}

function assert(v) {
  if (!v) {
    ThrowError("Assertion Failed!");
  }
}

function isNonNullObject(obj) {
  return obj && (typeof obj == "object" || typeof obj == "function");
}

module.exports = ReplayInspector;
