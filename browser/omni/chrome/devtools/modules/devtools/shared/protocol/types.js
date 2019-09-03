/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var { Actor } = require("./Actor");
var { lazyLoadSpec, lazyLoadFront } = require("devtools/shared/specs/index");

/**
 * Types: named marshallers/demarshallers.
 *
 * Types provide a 'write' function that takes a js representation and
 * returns a protocol representation, and a "read" function that
 * takes a protocol representation and returns a js representation.
 *
 * The read and write methods are also passed a context object that
 * represent the actor or front requesting the translation.
 *
 * Types are referred to with a typestring.  Basic types are
 * registered by name using addType, and more complex types can
 * be generated by adding detail to the type name.
 */

var types = Object.create(null);
exports.types = types;

var registeredTypes = (types.registeredTypes = new Map());
var registeredLifetimes = (types.registeredLifetimes = new Map());

exports.registeredTypes = registeredTypes;

/**
 * Return the type object associated with a given typestring.
 * If passed a type object, it will be returned unchanged.
 *
 * Types can be registered with addType, or can be created on
 * the fly with typestrings.  Examples:
 *
 *   boolean
 *   threadActor
 *   threadActor#detail
 *   array:threadActor
 *   array:array:threadActor#detail
 *
 * @param [typestring|type] type
 *    Either a typestring naming a type or a type object.
 *
 * @returns a type object.
 */
types.getType = function(type) {
  if (!type) {
    return types.Primitive;
  }

  if (typeof type !== "string") {
    return type;
  }

  // If already registered, we're done here.
  let reg = registeredTypes.get(type);
  if (reg) {
    return reg;
  }

  // Try to lazy load the spec, if not already loaded.
  if (lazyLoadSpec(type)) {
    // If a spec module was lazy loaded, it will synchronously call
    // generateActorSpec, and set the type in `registeredTypes`.
    reg = registeredTypes.get(type);
    if (reg) {
      return reg;
    }
  }

  // New type, see if it's a collection/lifetime type:
  const sep = type.indexOf(":");
  if (sep >= 0) {
    const collection = type.substring(0, sep);
    const subtype = types.getType(type.substring(sep + 1));

    if (collection === "array") {
      return types.addArrayType(subtype);
    } else if (collection === "nullable") {
      return types.addNullableType(subtype);
    }

    if (registeredLifetimes.has(collection)) {
      return types.addLifetimeType(collection, subtype);
    }

    throw Error("Unknown collection type: " + collection);
  }

  // Not a collection, might be actor detail
  const pieces = type.split("#", 2);
  if (pieces.length > 1) {
    if (pieces[1] != "actorid") {
      throw new Error(
        "Unsupported detail, only support 'actorid', got: " + pieces[1]
      );
    }
    return types.addActorDetail(type, pieces[0], pieces[1]);
  }

  throw Error("Unknown type: " + type);
};

/**
 * Don't allow undefined when writing primitive types to packets.  If
 * you want to allow undefined, use a nullable type.
 */
function identityWrite(v) {
  if (v === undefined) {
    throw Error("undefined passed where a value is required");
  }
  // This has to handle iterator->array conversion because arrays of
  // primitive types pass through here.
  if (v && typeof v.next === "function") {
    return [...v];
  }
  return v;
}

/**
 * Add a type to the type system.
 *
 * When registering a type, you can provide `read` and `write` methods.
 *
 * The `read` method will be passed a JS object value from the JSON
 * packet and must return a native representation.  The `write` method will
 * be passed a native representation and should provide a JSONable value.
 *
 * These methods will both be passed a context.  The context is the object
 * performing or servicing the request - on the server side it will be
 * an Actor, on the client side it will be a Front.
 *
 * @param typestring name
 *    Name to register
 * @param object typeObject
 *    An object whose properties will be stored in the type, including
 *    the `read` and `write` methods.
 * @param object options
 *    Can specify `thawed` to prevent the type from being frozen.
 *
 * @returns a type object that can be used in protocol definitions.
 */
types.addType = function(name, typeObject = {}, options = {}) {
  if (registeredTypes.has(name)) {
    throw Error("Type '" + name + "' already exists.");
  }

  const type = Object.assign(
    {
      toString() {
        return "[protocol type:" + name + "]";
      },
      name: name,
      primitive: !(typeObject.read || typeObject.write),
      read: identityWrite,
      write: identityWrite,
    },
    typeObject
  );

  registeredTypes.set(name, type);

  return type;
};

/**
 * Remove a type previously registered with the system.
 * Primarily useful for types registered by addons.
 */
types.removeType = function(name) {
  // This type may still be referenced by other types, make sure
  // those references don't work.
  const type = registeredTypes.get(name);

  type.name = "DEFUNCT:" + name;
  type.category = "defunct";
  type.primitive = false;
  type.read = type.write = function() {
    throw new Error("Using defunct type: " + name);
  };

  registeredTypes.delete(name);
};

/**
 * Add an array type to the type system.
 *
 * getType() will call this function if provided an "array:<type>"
 * typestring.
 *
 * @param type subtype
 *    The subtype to be held by the array.
 */
types.addArrayType = function(subtype) {
  subtype = types.getType(subtype);

  const name = "array:" + subtype.name;

  // Arrays of primitive types are primitive types themselves.
  if (subtype.primitive) {
    return types.addType(name);
  }
  return types.addType(name, {
    category: "array",
    read: (v, ctx) => {
      if (v && typeof v.next === "function") {
        v = [...v];
      }
      return v.map(i => subtype.read(i, ctx));
    },
    write: (v, ctx) => {
      if (v && typeof v.next === "function") {
        v = [...v];
      }
      return v.map(i => subtype.write(i, ctx));
    },
  });
};

/**
 * Add a dict type to the type system.  This allows you to serialize
 * a JS object that contains non-primitive subtypes.
 *
 * Properties of the value that aren't included in the specializations
 * will be serialized as primitive values.
 *
 * @param object specializations
 *    A dict of property names => type
 */
types.addDictType = function(name, specializations) {
  const specTypes = {};
  for (const prop in specializations) {
    try {
      specTypes[prop] = types.getType(specializations[prop]);
    } catch (e) {
      // Types may not be defined yet. Sometimes, we define the type *after* using it, but
      // also, we have cyclic definitions on types. So lazily load them when they are not
      // immediately available.
      loader.lazyGetter(specTypes, prop, () => {
        return types.getType(specializations[prop]);
      });
    }
  }
  return types.addType(name, {
    category: "dict",
    specializations,
    read: (v, ctx) => {
      const ret = {};
      for (const prop in v) {
        if (prop in specTypes) {
          ret[prop] = specTypes[prop].read(v[prop], ctx);
        } else {
          ret[prop] = v[prop];
        }
      }
      return ret;
    },

    write: (v, ctx) => {
      const ret = {};
      for (const prop in v) {
        if (prop in specTypes) {
          ret[prop] = specTypes[prop].write(v[prop], ctx);
        } else {
          ret[prop] = v[prop];
        }
      }
      return ret;
    },
  });
};

/**
 * Register an actor type with the type system.
 *
 * Types are marshalled differently when communicating server->client
 * than they are when communicating client->server.  The server needs
 * to provide useful information to the client, so uses the actor's
 * `form` method to get a json representation of the actor.  When
 * making a request from the client we only need the actor ID string.
 *
 * This function can be called before the associated actor has been
 * constructed, but the read and write methods won't work until
 * the associated addActorImpl or addActorFront methods have been
 * called during actor/front construction.
 *
 * @param string name
 *    The typestring to register.
 */
types.addActorType = function(name) {
  // We call addActorType from:
  //   FrontClassWithSpec when registering front synchronously,
  //   generateActorSpec when defining specs,
  //   specs modules to register actor type early to use them in other types
  if (registeredTypes.has(name)) {
    return registeredTypes.get(name);
  }
  const type = types.addType(name, {
    _actor: true,
    category: "actor",
    read: (v, ctx, detail) => {
      // If we're reading a request on the server side, just
      // find the actor registered with this actorID.
      if (ctx instanceof Actor) {
        return ctx.conn.getActor(v);
      }

      // Reading a response on the client side, check for an
      // existing front on the connection, and create the front
      // if it isn't found.
      const actorID = typeof v === "string" ? v : v.actor;
      // `ctx.conn` is a DebuggerClient
      let front = ctx.conn.getFrontByID(actorID);
      if (!front) {
        // If front isn't instantiated yet, create one.
        // Try lazy loading front if not already loaded.
        // The front module will synchronously call `FrontClassWithSpec` and
        // augment `type` with the `frontClass` attribute.
        if (!type.frontClass) {
          lazyLoadFront(name);
        }

        const parentFront = ctx.marshallPool();
        const targetFront = parentFront.targetFront;

        // Use intermediate Class variable to please eslint requiring
        // a capital letter for all constructors.
        const Class = type.frontClass;
        front = new Class(ctx.conn, targetFront, parentFront);
        front.actorID = actorID;
        parentFront.manage(front);
      }

      // When the type `${name}#actorid` is used, `v` is a string refering to the
      // actor ID. We only set the actorID just before and so do not need anything else.
      if (detail != "actorid") {
        v = identityWrite(v);
        front.form(v, ctx);
      }

      return front;
    },
    write: (v, ctx, detail) => {
      // If returning a response from the server side, make sure
      // the actor is added to a parent object and return its form.
      if (v instanceof Actor) {
        if (!v.actorID) {
          ctx.marshallPool().manage(v);
        }
        if (detail == "actorid") {
          return v.actorID;
        }
        return identityWrite(v.form(detail));
      }

      // Writing a request from the client side, just send the actor id.
      return v.actorID;
    },
  });
  return type;
};

types.addNullableType = function(subtype) {
  subtype = types.getType(subtype);
  return types.addType("nullable:" + subtype.name, {
    category: "nullable",
    read: (value, ctx) => {
      if (value == null) {
        return value;
      }
      return subtype.read(value, ctx);
    },
    write: (value, ctx) => {
      if (value == null) {
        return value;
      }
      return subtype.write(value, ctx);
    },
  });
};

/**
 * Register an actor detail type.  This is just like an actor type, but
 * will pass a detail hint to the actor's form method during serialization/
 * deserialization.
 *
 * This is called by getType() when passed an 'actorType#detail' string.
 *
 * @param string name
 *   The typestring to register this type as.
 * @param type actorType
 *   The actor type you'll be detailing.
 * @param string detail
 *   The detail to pass.
 */
types.addActorDetail = function(name, actorType, detail) {
  actorType = types.getType(actorType);
  if (!actorType._actor) {
    throw Error(
      `Details only apply to actor types, tried to add detail '${detail}' ` +
        `to ${actorType.name}`
    );
  }
  return types.addType(name, {
    _actor: true,
    category: "detail",
    read: (v, ctx) => actorType.read(v, ctx, detail),
    write: (v, ctx) => actorType.write(v, ctx, detail),
  });
};

/**
 * Register an actor lifetime.  This lets the type system find a parent
 * actor that differs from the actor fulfilling the request.
 *
 * @param string name
 *    The lifetime name to use in typestrings.
 * @param string prop
 *    The property of the actor that holds the parent that should be used.
 */
types.addLifetime = function(name, prop) {
  if (registeredLifetimes.has(name)) {
    throw Error("Lifetime '" + name + "' already registered.");
  }
  registeredLifetimes.set(name, prop);
};

/**
 * Remove a previously-registered lifetime.  Useful for lifetimes registered
 * in addons.
 */
types.removeLifetime = function(name) {
  registeredLifetimes.delete(name);
};

/**
 * Register a lifetime type.  This creates an actor type tied to the given
 * lifetime.
 *
 * This is called by getType() when passed a '<lifetimeType>:<actorType>'
 * typestring.
 *
 * @param string lifetime
 *    A lifetime string previously regisered with addLifetime()
 * @param type subtype
 *    An actor type
 */
types.addLifetimeType = function(lifetime, subtype) {
  subtype = types.getType(subtype);
  if (!subtype._actor) {
    throw Error(
      `Lifetimes only apply to actor types, tried to apply ` +
        `lifetime '${lifetime}' to ${subtype.name}`
    );
  }
  const prop = registeredLifetimes.get(lifetime);
  return types.addType(lifetime + ":" + subtype.name, {
    category: "lifetime",
    read: (value, ctx) => subtype.read(value, ctx[prop]),
    write: (value, ctx) => subtype.write(value, ctx[prop]),
  });
};

// Add a few named primitive types.
types.Primitive = types.addType("primitive");
types.String = types.addType("string");
types.Number = types.addType("number");
types.Boolean = types.addType("boolean");
types.JSON = types.addType("json");

exports.registerFront = function(cls) {
  const { typeName } = cls.prototype;
  if (!registeredTypes.has(typeName)) {
    types.addActorType(typeName);
  }
  registeredTypes.get(typeName).frontClass = cls;
};

/**
 * Instantiate a global (preference, device) or target-scoped (webconsole, inspector)
 * front of the given type by picking its actor ID out of either the target or root
 * front's form.
 *
 * @param DebuggerClient client
 *    The DebuggerClient instance to use.
 * @param string typeName
 *    The type name of the front to instantiate. This is defined in its specifiation.
 * @param json form
 *    If we want to instantiate a global actor's front, this is the root front's form,
 *    otherwise we are instantiating a target-scoped front from the target front's form.
 * @param [Target|null] target
 *    If we are instantiating a target-scoped front, this is a reference to the front's
 *    Target instance, otherwise this is null.
 */
function getFront(client, typeName, form, target = null) {
  const type = types.getType(typeName);
  if (!type) {
    throw new Error(`No spec for front type '${typeName}'.`);
  } else if (!type.frontClass) {
    lazyLoadFront(typeName);
  }

  // Use intermediate Class variable to please eslint requiring
  // a capital letter for all constructors.
  const Class = type.frontClass;
  const instance = new Class(client, target, target);
  const { formAttributeName } = instance;
  if (!formAttributeName) {
    throw new Error(`Can't find the form attribute name for ${typeName}`);
  }
  // Retrive the actor ID from root or target actor's form
  instance.actorID = form[formAttributeName];
  if (!instance.actorID) {
    throw new Error(
      `Can't find the actor ID for ${typeName} from root or target` +
        ` actor's form.`
    );
  }
  // Historically, all global and target scoped front were the first protocol.js in the
  // hierarchy of fronts. So that they have to self-own themself. But now, Root and Target
  // are fronts and should own them. The only issue here is that we should manage the
  // front *before* calling initialize which is going to try managing child fronts.
  if (!target) {
    instance.manage(instance);
  } else {
    target.manage(instance);
  }

  if (typeof instance.initialize == "function") {
    return instance.initialize().then(() => instance);
  }
  return instance;
}
exports.getFront = getFront;
