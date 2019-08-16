"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("devtools/client/debugger/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

loader.lazyRequireGetter(this, "_connect", "devtools/client/debugger/src/utils/connect");
loader.lazyRequireGetter(this, "_actions", "devtools/client/debugger/src/actions/index");

var _actions2 = _interopRequireDefault(_actions);

loader.lazyRequireGetter(this, "_selectors", "devtools/client/debugger/src/selectors/index");
loader.lazyRequireGetter(this, "_AccessibleImage", "devtools/client/debugger/src/components/shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    const { addEventListeners, removeEventListeners } = this.props;
    const eventsIds = category.events.map(event => event.id);

    if (isChecked) {
      addEventListeners(eventsIds);
    } else {
      removeEventListeners(eventsIds);
    }
  }

  onEventTypeClick(eventId, isChecked) {
    const { addEventListeners, removeEventListeners } = this.props;
    if (isChecked) {
      addEventListeners([eventId]);
    } else {
      removeEventListeners([eventId]);
    }
  }

  renderCategoryHeading(category) {
    const { activeEventListeners, expandedCategories } = this.props;
    const { events } = category;

    const expanded = expandedCategories.includes(category.name);
    const checked = events.every(({ id }) => activeEventListeners.includes(id));
    const indeterminate = !checked && events.some(({ id }) => activeEventListeners.includes(id));

    return _react2.default.createElement(
      "div",
      { className: "event-listener-header" },
      _react2.default.createElement(
        "button",
        {
          className: "event-listener-expand",
          onClick: () => this.onCategoryToggle(category.name)
        },
        _react2.default.createElement(_AccessibleImage2.default, { className: (0, _classnames2.default)("arrow", { expanded }) })
      ),
      _react2.default.createElement(
        "label",
        { className: "event-listener-label" },
        _react2.default.createElement("input", {
          type: "checkbox",
          value: category.name,
          onChange: e => {
            this.onCategoryClick(category,
            // Clicking an indeterminate checkbox should always have the
            // effect of disabling any selected items.
            indeterminate ? false : e.target.checked);
          },
          checked: checked,
          ref: el => el && (el.indeterminate = indeterminate)
        }),
        _react2.default.createElement(
          "span",
          { className: "event-listener-category" },
          category.name
        )
      )
    );
  }

  renderCategoryListing(category) {
    const { activeEventListeners, expandedCategories } = this.props;

    const expanded = expandedCategories.includes(category.name);
    if (!expanded) {
      return null;
    }

    return _react2.default.createElement(
      "ul",
      null,
      category.events.map(event => {
        return _react2.default.createElement(
          "li",
          { className: "event-listener-event", key: event.id },
          _react2.default.createElement(
            "label",
            { className: "event-listener-label" },
            _react2.default.createElement("input", {
              type: "checkbox",
              value: event.id,
              onChange: e => this.onEventTypeClick(event.id, e.target.checked),
              checked: activeEventListeners.includes(event.id)
            }),
            _react2.default.createElement(
              "span",
              { className: "event-listener-name" },
              event.name
            )
          )
        );
      })
    );
  }

  render() {
    const { categories } = this.props;

    return _react2.default.createElement(
      "div",
      { className: "event-listeners-content" },
      _react2.default.createElement(
        "ul",
        { className: "event-listeners-list" },
        categories.map((category, index) => {
          return _react2.default.createElement(
            "li",
            { className: "event-listener-group", key: index },
            this.renderCategoryHeading(category),
            this.renderCategoryListing(category)
          );
        })
      )
    );
  }
}

const mapStateToProps = state => ({
  activeEventListeners: (0, _selectors.getActiveEventListeners)(state),
  categories: (0, _selectors.getEventListenerBreakpointTypes)(state),
  expandedCategories: (0, _selectors.getEventListenerExpanded)(state)
});

exports.default = (0, _connect.connect)(mapStateToProps, {
  addEventListeners: _actions2.default.addEventListenerBreakpoints,
  removeEventListeners: _actions2.default.removeEventListenerBreakpoints,
  addEventListenerExpanded: _actions2.default.addEventListenerExpanded,
  removeEventListenerExpanded: _actions2.default.removeEventListenerExpanded
})(EventListeners);