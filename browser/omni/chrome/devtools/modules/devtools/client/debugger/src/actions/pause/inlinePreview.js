"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateInlinePreview = generateInlinePreview;

var _lodash = require("devtools/client/shared/vendor/lodash");

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_prefs", "devtools/client/debugger/src/utils/prefs");
loader.lazyRequireGetter(this, "_pause", "devtools/client/debugger/src/utils/pause/index");


// We need to display all variables in the current functional scope so
// include all data for block scopes until the first functional scope
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function getLocalScopeLevels(originalAstScopes) {
  let levels = 0;
  while (originalAstScopes[levels] && originalAstScopes[levels].type === "block") {
    levels++;
  }
  return levels;
}

function generateInlinePreview(thread, frame) {
  return async function ({ dispatch, getState, parser, client }) {
    if (!frame || !_prefs.features.inlinePreview) {
      return;
    }

    const originalAstScopes = await parser.getScopes(frame.location);

    const originalFrameScopes = (0, _selectors.getOriginalFrameScope)(getState(), thread, frame.location.sourceId, frame.id);

    const generatedFrameScopes = (0, _selectors.getGeneratedFrameScope)(getState(), thread, frame.id);

    let scopes = originalFrameScopes && originalFrameScopes.scope || generatedFrameScopes && generatedFrameScopes.scope;

    if (!scopes || !scopes.bindings || !originalAstScopes) {
      return;
    }

    const previews = {};
    const pausedOnLine = frame.location.line;

    const levels = getLocalScopeLevels(originalAstScopes);

    for (let curLevel = 0; curLevel <= levels && scopes && scopes.bindings; curLevel++) {
      const bindings = { ...scopes.bindings.variables };
      scopes.bindings.arguments.forEach(argument => {
        Object.keys(argument).forEach(key => {
          bindings[key] = argument[key];
        });
      });
      for (const name in bindings) {
        // We want to show values of properties of objects only and not
        // function calls on other data types like someArr.forEach etc..
        let properties = null;
        if (bindings[name].value.class === "Object") {
          const root = {
            name: name,
            path: name,
            contents: { value: bindings[name].value }
          };
          properties = await client.loadObjectProperties(root);
        }

        const preview = getBindingValues(originalAstScopes, pausedOnLine, name, bindings[name].value, curLevel, properties);

        for (const line in preview) {
          previews[line] = (previews[line] || []).concat(preview[line]);
        }
      }

      scopes = scopes.parent;
    }

    for (const line in previews) {
      previews[line] = (0, _lodash.sortBy)(previews[line], ["column"]);
    }

    return dispatch({
      type: "ADD_INLINE_PREVIEW",
      thread,
      frame,
      previews
    });
  };
}

function getBindingValues(originalAstScopes, pausedOnLine, name, value, curLevel, properties) {
  const previews = {};

  const binding = originalAstScopes[curLevel] && originalAstScopes[curLevel].bindings[name];
  if (!binding) {
    return previews;
  }

  // Show a variable only once ( an object and it's child property are
  // counted as different )
  const identifiers = new Set();

  // We start from end as we want to show values besides variable
  // located nearest to the breakpoint
  for (let i = binding.refs.length - 1; i >= 0; i--) {
    const ref = binding.refs[i];
    // Subtracting 1 from line as codemirror lines are 0 indexed
    let line = ref.start.line - 1;
    const column = ref.start.column;
    // We don't want to render inline preview below the paused line
    if (line >= pausedOnLine - 1) {
      continue;
    }

    // Converting to string as all iterators on object keys ( eg: Object.keys,
    // for..in ) will return string
    line = line.toString();

    const { displayName, displayValue } = getExpressionNameAndValue(name, value, ref, properties);

    // Variable with same name exists, display value of current or
    // closest to the current scope's variable
    if (identifiers.has(displayName)) {
      continue;
    }

    if (!previews[line]) {
      previews[line] = [];
    }

    identifiers.add(displayName);

    previews[line].push({
      name: displayName,
      value: (0, _pause.getValue)(displayValue),
      column
    });
  }
  return previews;
}

function getExpressionNameAndValue(name, value,
// TODO: Add data type to ref
ref, properties) {
  let displayName = name;
  let displayValue = value;

  // Only variables of type Object will have properties
  if (properties) {
    let { meta } = ref;
    // Presence of meta property means expression contains child property
    // reference eg: objName.propName
    while (meta) {
      // Initially properties will be an array, after that it will be an object
      if (displayValue === value) {
        const property = properties.find(prop => prop.name === meta.property);
        displayValue = property && property.contents.value;
        displayName += `.${meta.property}`;
      } else if (displayValue && displayValue.preview) {
        const { ownProperties } = displayValue.preview;
        for (const prop in ownProperties) {
          if (prop === meta.property) {
            displayValue = ownProperties[prop].value;
            displayName += `.${meta.property}`;
          }
        }
      }
      meta = meta.parent;
    }
  }

  return { displayName, displayValue };
}