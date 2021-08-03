import { __assign, __extends } from "tslib";
import { format as formatDate } from "date-fns";
import MixedSchema from "yup/lib/mixed";
// the file validation schema
var DateTimeSchema = /** @class */ (function (_super) {
    __extends(DateTimeSchema, _super);
    function DateTimeSchema(variant) {
        var _this = _super.call(this, { type: "datetime" }) || this;
        _this._variant = "datetime";
        if (variant) {
            _this._variant = variant;
        }
        return _this;
    }
    DateTimeSchema.prototype._typeCheck = function (value) {
        return value && value instanceof Date;
    };
    DateTimeSchema.prototype._isPresent = function (value) {
        return value && value instanceof Date;
    };
    DateTimeSchema.prototype.min = function (min, format, message) {
        if (format === void 0) { format = "dd-MM-yyyy HH:mm:ss"; }
        if (message === void 0) { message = "${path} must be greater than ${min}"; }
        return this.test({
            message: message,
            name: "min",
            exclusive: true,
            params: { min: formatDate(min, format) },
            test: function (value) {
                return value && value >= min;
            }
        });
    };
    DateTimeSchema.prototype.max = function (max, format, message) {
        if (format === void 0) { format = "dd-MM-yyyy HH:mm:ss"; }
        if (message === void 0) { message = "${path} must be lesser than ${max}"; }
        return this.test({
            name: "max",
            exclusive: true,
            message: message,
            params: { max: formatDate(max, format) },
            test: function (value) {
                return value && value <= max;
            }
        });
    };
    DateTimeSchema.prototype.describe = function () {
        var description = _super.prototype.describe.call(this);
        var thisDescription = __assign(__assign({}, description), { variant: this._variant });
        return thisDescription;
    };
    return DateTimeSchema;
}(MixedSchema));
export { DateTimeSchema };
export default function yupDateTime(variant) {
    return new DateTimeSchema(variant);
}
yupDateTime.prototype = DateTimeSchema.prototype;
