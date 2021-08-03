import { Box, Grid, Typography } from "@material-ui/core";
import * as React from "react";
var Page = function (_a) {
    var title = _a.title, children = _a.children;
    return (React.createElement(Grid, { container: true },
        React.createElement(Grid, { item: true, xs: 12 },
            React.createElement(Box, { pl: 1, pt: 1, pr: 1 },
                React.createElement(Typography, { variant: "h5" }, title))),
        React.createElement(Grid, { item: true, xs: 12 },
            React.createElement(Box, { pl: 1, pb: 1, pr: 1 }, children))));
};
export default Page;
