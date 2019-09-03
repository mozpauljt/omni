"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("devtools/client/shared/vendor/react"));

var _classnames = _interopRequireDefault(require("devtools/client/debugger/dist/vendors").vendored["classnames"]);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class OutlineFilter extends _react.Component {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "state", {
      focused: false
    });

    _defineProperty(this, "setFocus", shouldFocus => {
      this.setState({
        focused: shouldFocus
      });
    });

    _defineProperty(this, "onChange", e => {
      this.props.updateFilter(e.target.value);
    });

    _defineProperty(this, "onKeyDown", e => {
      if (e.key === "Escape" && this.props.filter !== "") {
        // use preventDefault to override toggling the split-console which is
        // also bound to the ESC key
        e.preventDefault();
        this.props.updateFilter("");
      } else if (e.key === "Enter") {
        // We must prevent the form submission from taking any action
        // https://github.com/firefox-devtools/debugger/pull/7308
        e.preventDefault();
      }
    });
  }

  render() {
    const {
      focused
    } = this.state;
    return _react.default.createElement("div", {
      className: "outline-filter"
    }, _react.default.createElement("form", null, _react.default.createElement("input", {
      className: (0, _classnames.default)("outline-filter-input", {
        focused
      }),
      onFocus: () => this.setFocus(true),
      onBlur: () => this.setFocus(false),
      placeholder: L10N.getStr("outline.placeholder"),
      value: this.props.filter,
      type: "text",
      onChange: this.onChange,
      onKeyDown: this.onKeyDown
    })));
  }

}

exports.default = OutlineFilter;