/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  ADD_REQUEST,
  CLEAR_REQUESTS,
  CLONE_REQUEST,
  CLONE_SELECTED_REQUEST,
  REMOVE_SELECTED_CUSTOM_REQUEST,
  RIGHT_CLICK_REQUEST,
  SEND_CUSTOM_REQUEST,
  TOGGLE_RECORDING,
  UPDATE_REQUEST,
} = require("devtools/client/netmonitor/src/constants");
const {
  getSelectedRequest,
  getRequestById,
} = require("devtools/client/netmonitor/src/selectors/index");

function addRequest(id, data, batch) {
  return {
    type: ADD_REQUEST,
    id,
    data,
    meta: { batch },
  };
}

function updateRequest(id, data, batch) {
  return {
    type: UPDATE_REQUEST,
    id,
    data,
    meta: { batch },
  };
}

/**
 * Clone request by id. Used when cloning a request
 * through the "Edit and Resend" option present in the context menu.
 */
function cloneRequest(id) {
  return {
    id,
    type: CLONE_REQUEST,
  };
}

/**
 * Right click a request without selecting it.
 */
function rightClickRequest(id) {
  return {
    id,
    type: RIGHT_CLICK_REQUEST,
  };
}

/**
 * Clone the currently selected request, set the "isCustom" attribute.
 * Used by the "Edit and Resend" feature.
 */
function cloneSelectedRequest() {
  return {
    type: CLONE_SELECTED_REQUEST,
  };
}

/**
 * Send a new HTTP request using the data in the custom request form.
 */
function sendCustomRequest(connector, requestId = null) {
  return (dispatch, getState) => {
    let request;
    if (requestId) {
      request = getRequestById(getState(), requestId);
    } else {
      request = getSelectedRequest(getState());
    }

    if (!request) {
      return;
    }

    // Send a new HTTP request using the data in the custom request form
    const data = {
      cause: request.cause,
      url: request.url,
      method: request.method,
      httpVersion: request.httpVersion,
    };
    if (request.requestHeaders) {
      data.headers = request.requestHeaders.headers;
    }
    if (request.requestPostData) {
      data.body = request.requestPostData.postData.text;
    }

    connector.sendHTTPRequest(data, response => {
      return dispatch({
        type: SEND_CUSTOM_REQUEST,
        id: response.eventActor.actor,
      });
    });
  };
}

/**
 * Remove a request from the list. Supports removing only cloned requests with a
 * "isCustom" attribute. Other requests never need to be removed.
 */
function removeSelectedCustomRequest() {
  return {
    type: REMOVE_SELECTED_CUSTOM_REQUEST,
  };
}

function clearRequests() {
  return {
    type: CLEAR_REQUESTS,
  };
}

/**
 * Toggle monitoring
 */
function toggleRecording() {
  return {
    type: TOGGLE_RECORDING,
  };
}

module.exports = {
  addRequest,
  clearRequests,
  cloneRequest,
  cloneSelectedRequest,
  rightClickRequest,
  removeSelectedCustomRequest,
  sendCustomRequest,
  toggleRecording,
  updateRequest,
};
