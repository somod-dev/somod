import { AppBarProps } from "@material-ui/core";
import * as React from "react";
export declare type DashboardProps = {
    color?: AppBarProps["color"];
    title?: string;
    actions?: React.ReactNode;
    menu?: React.ReactNode;
};
declare const Dashboard: React.FunctionComponent<DashboardProps>;
export default Dashboard;
