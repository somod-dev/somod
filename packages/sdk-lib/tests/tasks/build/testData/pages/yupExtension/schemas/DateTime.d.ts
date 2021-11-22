import MixedSchema from "yup/lib/mixed";
import { SchemaDescription } from "yup/lib/schema";
export declare type Variant = "datetime" | "date" | "time";
export declare class DateTimeSchema extends MixedSchema {
    _variant: Variant;
    constructor(variant: Variant);
    _typeCheck(value: Date): value is NonNullable<Date>;
    _isPresent(value: Date): boolean;
    min(min: Date, format?: string, message?: string): this;
    max(max: Date, format?: string, message?: string): this;
    describe(): SchemaDescription & {
        variant: Variant;
    };
}
declare function yupDateTime(variant: Variant): DateTimeSchema;
declare namespace yupDateTime {
    var prototype: DateTimeSchema;
}
export default yupDateTime;
