"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Dropdown = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Dropdown extends _react.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "toggleDropdown", e => {
      this.setState(prevState => ({
        dropdownShown: !prevState.dropdownShown
      }));
    });

    this.state = {
      dropdownShown: false
    };
  }

  renderPanel() {
    return _react.default.createElement("div", {
      className: "dropdown",
      onClick: this.toggleDropdown,
      style: {
        display: this.state.dropdownShown ? "block" : "none"
      }
    }, this.props.panel);
  }

  renderButton() {
    return (// eslint-disable-next-line prettier/prettier
      _react.default.createElement("button", {
        className: "dropdown-button",
        onClick: this.toggleDropdown
      }, this.props.icon)
    );
  }

  renderMask() {
    return _react.default.createElement("div", {
      className: "dropdown-mask",
      onClick: this.toggleDropdown,
      style: {
        display: this.state.dropdownShown ? "block" : "none"
      }
    });
  }

  render() {
    return _react.default.createElement("div", {
      className: "dropdown-block"
    }, this.renderPanel(), this.renderButton(), this.renderMask());
  }

}

exports.Dropdown = Dropdown;
var _default = Dropdown;
exports.default = _default;