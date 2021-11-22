/// <reference types="react" />
declare type ViewProps = {
    value: string | number | boolean | Date;
    type: "string" | "number" | "boolean" | "datetime";
    variant: "datetime" | "date" | "time";
};
declare const View: ({ value, type, variant }: ViewProps) => JSX.Element;
export default View;
