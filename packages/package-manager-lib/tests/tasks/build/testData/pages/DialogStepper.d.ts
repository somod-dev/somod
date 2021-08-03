import { DialogProps } from "@material-ui/core";
import * as React from "react";
export declare type DialogStepperProps = {
    step?: number;
    title: React.ReactNode;
    children: React.ReactNode;
    back: {
        disabled?: boolean;
        on: () => Promise<unknown>;
        label?: string;
        variant?: "outlined" | "contained" | "text";
    };
    next: {
        disabled?: boolean;
        on: () => Promise<unknown>;
        label?: string;
        variant?: "outlined" | "contained" | "text";
    };
} & DialogProps;
declare const DialogStepper: React.FunctionComponent<DialogStepperProps>;
export default DialogStepper;
