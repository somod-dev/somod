import { string, number, boolean } from "yup";
// eslint-disable-next-line import/named
import yupDateTime from "./schemas/DateTime";
import yupFile from "./schemas/File";
// type-casting schema based on type property
export var stringSchema = function (schema) {
    if (schema.type === "string") {
        //@ts-expect-error type of schema is confirmed by schema.type === "string"
        return string().concat(schema);
    }
    throw new Error("TypeCast Error: expected type of schema is string , but found " +
        schema.type);
};
export var numberSchema = function (schema) {
    if (schema.type === "number") {
        //@ts-expect-error type of schema is confirmed by schema.type === "number"
        return number().concat(schema);
    }
    throw new Error("TypeCast Error: expected type of schema is number , but found " +
        schema.type);
};
export var booleanSchema = function (schema) {
    if (schema.type === "boolean") {
        //@ts-expect-error type of schema is confirmed by schema.type === "boolean"
        return boolean().concat(schema);
    }
    throw new Error("TypeCast Error: expected type of schema is boolean , but found " +
        schema.type);
};
export var datetimeSchema = function (schema) {
    if (schema.type === "datetime") {
        //@ts-expect-error concat returns this
        return yupDateTime().concat(schema);
    }
    throw new Error("TypeCast Error: expected type of schema is datetime , but found " +
        schema.type);
};
export var fileSchema = function (schema) {
    if (schema.type === "file") {
        //@ts-expect-error concat returns this
        return yupFile().concat(schema);
    }
    throw new Error("TypeCast Error: expected type of schema is file , but found " + schema.type);
};
export var appendRequiredOnYupSchema = function (schema) {
    if (schema && schema.required) {
        schema = schema.required();
    }
    return schema;
};
export var describeFields = function (schema) {
    var schemaDescription = schema.describe().fields;
    // @ts-expect-error type-casting from SchemaFieldDescription to SchemaDescription
    return schemaDescription;
};
export var getFieldLabels = function (schema) {
    var schemaDescription = describeFields(schema);
    var labels = {};
    Object.keys(schemaDescription).map(function (fieldName) { return (labels[fieldName] = schemaDescription[fieldName].label); });
    return labels;
};
export var getFieldTypes = function (schema) {
    var schemaDescription = describeFields(schema);
    var types = {};
    Object.keys(schemaDescription).map(function (fieldName) { return (types[fieldName] = schemaDescription[fieldName].type); });
    return types;
};
export var reverseKeyOrder = function (obj) {
    var _obj = {};
    Object.keys(obj)
        .reverse()
        .forEach(function (key) {
        _obj[key] = obj[key];
    });
    return _obj;
};
