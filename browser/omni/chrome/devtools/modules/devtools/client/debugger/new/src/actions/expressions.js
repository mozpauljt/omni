"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addExpression = addExpression;
exports.autocomplete = autocomplete;
exports.clearAutocomplete = clearAutocomplete;
exports.clearExpressionError = clearExpressionError;
exports.updateExpression = updateExpression;
exports.deleteExpression = deleteExpression;
exports.evaluateExpressions = evaluateExpressions;
exports.getMappedExpression = getMappedExpression;

var _selectors = require("../selectors/index");

var _promise = require("./utils/middleware/promise");

var _expressions = require("../utils/expressions");

var _prefs = require("../utils/prefs");

var _source = require("../utils/source");

var _parser = require("../workers/parser/index");

var parser = _interopRequireWildcard(_parser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Add expression for debugger to watch
 *
 * @param {object} expression
 * @param {number} expression.id
 * @memberof actions/pause
 * @static
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function addExpression(input) {
  return async ({ dispatch, getState }) => {
    if (!input) {
      return;
    }

    const expressionError = await parser.hasSyntaxError(input);

    const expression = (0, _selectors.getExpression)(getState(), input);
    if (expression) {
      return dispatch(evaluateExpression(expression));
    }

    dispatch({ type: "ADD_EXPRESSION", input, expressionError });

    const newExpression = (0, _selectors.getExpression)(getState(), input);
    if (newExpression) {
      return dispatch(evaluateExpression(newExpression));
    }
  };
}

function autocomplete(input, cursor) {
  return async ({ dispatch, getState, client }) => {
    if (!input) {
      return;
    }
    const thread = (0, _selectors.getCurrentThread)(getState());
    const frameId = (0, _selectors.getSelectedFrameId)(getState(), thread);
    const result = await client.autocomplete(input, cursor, frameId);
    await dispatch({ type: "AUTOCOMPLETE", input, result });
  };
}

function clearAutocomplete() {
  return { type: "CLEAR_AUTOCOMPLETE" };
}

function clearExpressionError() {
  return { type: "CLEAR_EXPRESSION_ERROR" };
}

function updateExpression(input, expression) {
  return async ({ dispatch, getState }) => {
    if (!input) {
      return;
    }

    const expressionError = await parser.hasSyntaxError(input);
    dispatch({
      type: "UPDATE_EXPRESSION",
      expression,
      input: expressionError ? expression.input : input,
      expressionError
    });

    dispatch(evaluateExpressions());
  };
}

/**
 *
 * @param {object} expression
 * @param {number} expression.id
 * @memberof actions/pause
 * @static
 */
function deleteExpression(expression) {
  return ({ dispatch }) => {
    dispatch({
      type: "DELETE_EXPRESSION",
      input: expression.input
    });
  };
}

/**
 *
 * @memberof actions/pause
 * @param {number} selectedFrameId
 * @static
 */
function evaluateExpressions() {
  return async function ({ dispatch, getState, client }) {
    const expressions = (0, _selectors.getExpressions)(getState()).toJS();
    const inputs = expressions.map(({ input }) => input);
    const thread = (0, _selectors.getCurrentThread)(getState());
    const frameId = (0, _selectors.getSelectedFrameId)(getState(), thread);
    const results = await client.evaluateExpressions(inputs, {
      frameId,
      thread
    });
    dispatch({ type: "EVALUATE_EXPRESSIONS", inputs, results });
  };
}

function evaluateExpression(expression) {
  return async function ({ dispatch, getState, client, sourceMaps }) {
    if (!expression.input) {
      console.warn("Expressions should not be empty");
      return;
    }

    let input = expression.input;
    const thread = (0, _selectors.getCurrentThread)(getState());
    const frame = (0, _selectors.getSelectedFrame)(getState(), thread);

    if (frame) {
      const { location } = frame;
      const source = (0, _selectors.getSourceFromId)(getState(), location.sourceId);

      const selectedSource = (0, _selectors.getSelectedSource)(getState());

      if (selectedSource && (0, _source.isOriginal)(source) && (0, _source.isOriginal)(selectedSource)) {
        const mapResult = await dispatch(getMappedExpression(input));
        if (mapResult) {
          input = mapResult.expression;
        }
      }
    }

    const frameId = (0, _selectors.getSelectedFrameId)(getState(), thread);

    return dispatch({
      type: "EVALUATE_EXPRESSION",
      thread,
      input: expression.input,
      [_promise.PROMISE]: client.evaluateInFrame((0, _expressions.wrapExpression)(input), {
        frameId,
        thread
      })
    });
  };
}

/**
 * Gets information about original variable names from the source map
 * and replaces all posible generated names.
 */
function getMappedExpression(expression) {
  return async function ({ dispatch, getState, client, sourceMaps }) {
    const state = getState();
    const thread = (0, _selectors.getCurrentThread)(getState());
    const mappings = (0, _selectors.getSelectedScopeMappings)(state, thread);
    const bindings = (0, _selectors.getSelectedFrameBindings)(state, thread);

    // We bail early if we do not need to map the expression. This is important
    // because mapping an expression can be slow if the parser worker is
    // busy doing other work.
    //
    // 1. there are no mappings - we do not need to map original expressions
    // 2. does not contain `await` - we do not need to map top level awaits
    // 3. does not contain `=` - we do not need to map assignments
    if (!mappings && !expression.match(/(await|=)/)) {
      return null;
    }

    return parser.mapExpression(expression, mappings, bindings || [], _prefs.features.mapExpressionBindings && (0, _selectors.getIsPaused)(state, thread), _prefs.features.mapAwaitExpression);
  };
}