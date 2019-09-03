"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");

var _actions = _interopRequireDefault(require("../../actions/index"));

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");

var _AccessibleImage = _interopRequireDefault(require("../shared/AccessibleImage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */
class EventListeners extends _react.Component {
  onCategoryToggle(category) {
    const {
      expandedCategories,
      removeEventListenerExpanded,
      addEventListenerExpanded
    } = this.props;

    if (expandedCategories.includes(category)) {
      removeEventListenerExpanded(category);
    } else {
      addEventListenerExpanded(category);
    }
  }

  onCategoryClick(category, isChecked) {
    const {
      addEventListeners,
      removeEventListeners
    } = this.props;
    const eventsIds = category.events.map(event => event.id);

    if (isChecked) {
      addEventListeners(eventsIds);
    } else {
      removeEventListeners(eventsIds);
    }
  }

  onEventTypeClick(eventId, isChecked) {
    const {
      addEventListeners,
      removeEventListeners
    } = this.props;

    if (isChecked) {
      addEventListeners([eventId]);
    } else {
      removeEventListeners([eventId]);
    }
  }

  renderCategoryHeading(category) {
    const {
      activeEventListeners,
      expandedCategories
    } = this.props;
    const {
      events
    } = category;
    const expanded = expandedCategories.includes(category.name);
    const checked = events.every(({
      id
    }) => activeEventListeners.includes(id));
    const indeterminate = !checked && events.some(({
      id
    }) => activeEventListeners.includes(id));
    return _react.default.createElement("div", {
      className: "event-listener-header"
    }, _react.default.createElement("button", {
      className: "event-listener-expand",
      onClick: () => this.onCategoryToggle(category.name)
    }, _react.default.createElement(_AccessibleImage.default, {
      className: (0, _classnames.default)("arrow", {
        expanded
      })
    })), _react.default.createElement("label", {
      className: "event-listener-label"
    }, _react.default.createElement("input", {
      type: "checkbox",
      value: category.name,
      onChange: e => {
        this.onCategoryClick(category, // Clicking an indeterminate checkbox should always have the
        // effect of disabling any selected items.
        indeterminate ? false : e.target.checked);
      },
      checked: checked,
      ref: el => el && (el.indeterminate = indeterminate)
    }), _react.default.createElement("span", {
      className: "event-listener-category"
    }, category.name)));
  }

  renderCategoryListing(category) {
    const {
      activeEventListeners,
      expandedCategories
    } = this.props;
    const expanded = expandedCategories.includes(category.name);

    if (!expanded) {
      return null;
    }

    return _react.default.createElement("ul", null, category.events.map(event => {
      return _react.default.createElement("li", {
        className: "event-listener-event",
        key: event.id
      }, _react.default.createElement("label", {
        className: "event-listener-label"
      }, _react.default.createElement("input", {
        type: "checkbox",
        value: event.id,
        onChange: e => this.onEventTypeClick(event.id, e.target.checked),
        checked: activeEventListeners.includes(event.id)
      }), _react.default.createElement("span", {
        className: "event-listener-name"
      }, event.name)));
    }));
  }

  render() {
    const {
      categories
    } = this.props;
    return _react.default.createElement("div", {
      className: "event-listeners-content"
    }, _react.default.createElement("ul", {
      className: "event-listeners-list"
    }, categories.map((category, index) => {
      return _react.default.createElement("li", {
        className: "event-listener-group",
        key: index
      }, this.renderCategoryHeading(category), this.renderCategoryListing(category));
    })));
  }

}

const mapStateToProps = state => ({
  activeEventListeners: (0, _selectors.getActiveEventListeners)(state),
  categories: (0, _selectors.getEventListenerBreakpointTypes)(state),
  expandedCategories: (0, _selectors.getEventListenerExpanded)(state)
});

var _default = (0, _connect.connect)(mapStateToProps, {
  addEventListeners: _actions.default.addEventListenerBreakpoints,
  removeEventListeners: _actions.default.removeEventListenerBreakpoints,
  addEventListenerExpanded: _actions.default.addEventListenerExpanded,
  removeEventListenerExpanded: _actions.default.removeEventListenerExpanded
})(EventListeners);

exports.default = _default;