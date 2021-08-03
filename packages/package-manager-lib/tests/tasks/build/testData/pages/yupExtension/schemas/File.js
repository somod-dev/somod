import { __extends } from "tslib";
import { MixedSchema } from "yup";
// the file validation schema
var FileSchema = /** @class */ (function (_super) {
    __extends(FileSchema, _super);
    function FileSchema() {
        return _super.call(this, { type: "file" }) || this;
    }
    FileSchema.prototype._typeCheck = function (value) {
        return value && value instanceof Array;
    };
    FileSchema.prototype._isPresent = function (value) {
        return value && value.length > 0;
    };
    FileSchema.prototype.min = function (min, message) {
        if (message === void 0) { message = "${path} must be at least ${min} files"; }
        return this.test({
            message: message,
            name: "min",
            exclusive: true,
            params: { min: min },
            test: function (value) {
                return value && value.length >= min;
            }
        });
    };
    FileSchema.prototype.max = function (max, message) {
        if (message === void 0) { message = "${path} must be at most ${max} files"; }
        return this.test({
            name: "max",
            exclusive: true,
            message: message,
            params: { max: max },
            test: function (value) {
                return !value || value.length <= max;
            }
        });
    };
    FileSchema.prototype.minSize = function (min, message) {
        if (message === void 0) { message = "${path} must be at least ${min} bytes in size"; }
        return this.test({
            message: message,
            name: "minSize",
            exclusive: true,
            params: { min: min },
            test: function (value) {
                return value && value.every(function (file) { return file.size >= min; });
            }
        });
    };
    FileSchema.prototype.maxSize = function (max, message) {
        if (message === void 0) { message = "${path} must be at most ${max} bytes in size"; }
        return this.test({
            name: "maxSize",
            exclusive: true,
            message: message,
            params: { max: max },
            test: function (value) {
                return !value || value.every(function (file) { return file.size <= max; });
            }
        });
    };
    return FileSchema;
}(MixedSchema));
export { FileSchema };
export default function yupFile() {
    //@ts-expect-error nullable returns this
    return new FileSchema().nullable();
}
