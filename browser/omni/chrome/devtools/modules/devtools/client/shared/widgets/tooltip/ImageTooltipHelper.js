/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {LocalizationHelper} = require("devtools/shared/l10n");
const L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

const XHTML_NS = "http://www.w3.org/1999/xhtml";

// Default image tooltip max dimension
const MAX_DIMENSION = 200;
const CONTAINER_MIN_WIDTH = 100;
const LABEL_HEIGHT = 20;
const IMAGE_PADDING = 4;

/**
 * Image preview tooltips should be provided with the naturalHeight and
 * naturalWidth value for the image to display. This helper loads the provided
 * image URL in an image object in order to retrieve the image dimensions after
 * the load.
 *
 * @param {Document} doc the document element to use to create the image object
 * @param {String} imageUrl the url of the image to measure
 * @return {Promise} returns a promise that will resolve after the iamge load:
 *         - {Number} naturalWidth natural width of the loaded image
 *         - {Number} naturalHeight natural height of the loaded image
 */
function getImageDimensions(doc, imageUrl) {
  return new Promise(resolve => {
    const imgObj = new doc.defaultView.Image();
    imgObj.onload = () => {
      imgObj.onload = null;
      const { naturalWidth, naturalHeight } = imgObj;
      resolve({ naturalWidth, naturalHeight });
    };
    imgObj.src = imageUrl;
  });
}

/**
 * Set the tooltip content of a provided HTMLTooltip instance to display an
 * image preview matching the provided imageUrl.
 *
 * @param {HTMLTooltip} tooltip
 *        The tooltip instance on which the image preview content should be set
 * @param {Document} doc
 *        A document element to create the HTML elements needed for the tooltip
 * @param {String} imageUrl
 *        Absolute URL of the image to display in the tooltip
 * @param {Object} options
 *        - {Number} naturalWidth mandatory, width of the image to display
 *        - {Number} naturalHeight mandatory, height of the image to display
 *        - {Number} maxDim optional, max width/height of the preview
 *        - {Boolean} hideDimensionLabel optional, pass true to hide the label
 *        - {Boolean} hideCheckeredBackground optional, pass true to hide
                      the checkered background
 */
function setImageTooltip(tooltip, doc, imageUrl, options) {
  let {naturalWidth, naturalHeight, hideDimensionLabel,
       hideCheckeredBackground, maxDim} = options;
  maxDim = maxDim || MAX_DIMENSION;

  let imgHeight = naturalHeight;
  let imgWidth = naturalWidth;
  if (imgHeight > maxDim || imgWidth > maxDim) {
    const scale = maxDim / Math.max(imgHeight, imgWidth);
    // Only allow integer values to avoid rounding errors.
    imgHeight = Math.floor(scale * naturalHeight);
    imgWidth = Math.ceil(scale * naturalWidth);
  }

  let imageClass = "";
  if (!hideCheckeredBackground) {
    imageClass = "devtools-tooltip-tiles";
  }

  // Create tooltip content
  const div = doc.createElementNS(XHTML_NS, "div");
  div.style.cssText = `
    height: 100%;
    min-width: 100px;
    display: flex;
    flex-direction: column;
    text-align: center;`;
  let html = `
    <div style="flex: 1;
                display: flex;
                padding: ${IMAGE_PADDING}px;
                align-items: center;
                justify-content: center;
                min-height: 1px;">
      <img class="${imageClass}"
           style="height: ${imgHeight}px; max-height: 100%;"
           src="${encodeURI(imageUrl)}"/>
    </div>`;

  if (!hideDimensionLabel) {
    const label = naturalWidth + " \u00D7 " + naturalHeight;
    html += `
      <div style="height: ${LABEL_HEIGHT}px;
                  text-align: center;">
        <span class="theme-comment devtools-tooltip-caption">${label}</span>
      </div>`;
  }
  // eslint-disable-next-line no-unsanitized/property
  div.innerHTML = html;

  // Calculate tooltip dimensions
  let height = imgHeight + 2 * IMAGE_PADDING;
  if (!hideDimensionLabel) {
    height += LABEL_HEIGHT;
  }
  const width = Math.max(CONTAINER_MIN_WIDTH, imgWidth + 2 * IMAGE_PADDING);

  tooltip.panel.innerHTML = "";
  tooltip.panel.appendChild(div);
  tooltip.setContentSize({width, height});
}

/*
 * Set the tooltip content of a provided HTMLTooltip instance to display a
 * fallback error message when an image preview tooltip can not be displayed.
 *
 * @param {HTMLTooltip} tooltip
 *        The tooltip instance on which the image preview content should be set
 * @param {Document} doc
 *        A document element to create the HTML elements needed for the tooltip
 */
function setBrokenImageTooltip(tooltip, doc) {
  const div = doc.createElementNS(XHTML_NS, "div");
  div.className = "theme-comment devtools-tooltip-image-broken";
  const message = L10N.getStr("previewTooltip.image.brokenImage");
  div.textContent = message;

  tooltip.panel.innerHTML = "";
  tooltip.panel.appendChild(div);
  tooltip.setContentSize({width: "auto", height: "auto"});
}

module.exports.getImageDimensions = getImageDimensions;
module.exports.setImageTooltip = setImageTooltip;
module.exports.setBrokenImageTooltip = setBrokenImageTooltip;
