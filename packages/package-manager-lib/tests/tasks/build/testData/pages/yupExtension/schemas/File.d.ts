import { MixedSchema } from "yup";
export declare type FileType = File[];
export declare class FileSchema extends MixedSchema {
    constructor();
    _typeCheck(value: FileType): value is NonNullable<FileType>;
    _isPresent(value: FileType): boolean;
    min(min: number, message?: string): this;
    max(max: number, message?: string): this;
    minSize(min: number, message?: string): this;
    maxSize(max: number, message?: string): this;
}
export default function yupFile(): FileSchema;
