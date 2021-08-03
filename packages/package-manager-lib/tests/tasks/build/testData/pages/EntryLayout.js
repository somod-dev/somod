import { Paper, Container, Grid, Typography, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useLinkContext } from "./context/LinkContext";
import { useOrganizationContext } from "./context/OrganizationContext";
import * as React from "react";
var useStyles = makeStyles(function (theme) { return ({
    paper: {
        padding: theme.spacing(1)
    },
    logo: {
        width: theme.spacing(32),
        height: theme.spacing(8),
        objectFit: "contain"
    },
    content: {
        width: "100%",
        overflow: "hidden"
    },
    footer: {
        width: "100%",
        "& a": {
            margin: theme.spacing(1)
        }
    },
    footerLeft: {
        flexGrow: 1
    }
}); });
var EntryLayout = function (props) {
    var classes = useStyles();
    var orgParams = useOrganizationContext();
    var Link = useLinkContext();
    return (React.createElement(Grid, { container: true, alignItems: "center", style: { height: "100vh" } },
        React.createElement(Container, { maxWidth: "xs", disableGutters: true },
            React.createElement(Paper, { elevation: 2, className: classes.paper },
                React.createElement(Grid, { container: true, direction: "column", alignItems: "center" },
                    React.createElement(Grid, { item: true },
                        React.createElement(Link, { href: orgParams.home },
                            React.createElement("img", { src: orgParams.logo, alt: orgParams.name, className: classes.logo }))),
                    React.createElement(Grid, { item: true },
                        React.createElement(Typography, { variant: "h5" }, props.title)),
                    React.createElement(Grid, { item: true },
                        React.createElement(Typography, { variant: "subtitle1" }, props.subTitle)),
                    React.createElement(Grid, { item: true, className: classes.content },
                        React.createElement(Box, { p: 1 },
                            " ",
                            props.children)))),
            React.createElement(Grid, { container: true, className: classes.footer },
                React.createElement(Grid, { item: true, className: classes.footerLeft },
                    React.createElement(Link, { href: orgParams.contact, variant: "caption" }, "Contact Us")),
                React.createElement(Grid, { item: true },
                    React.createElement(Link, { href: orgParams.privacy, variant: "caption" }, "Privacy"),
                    React.createElement(Link, { href: orgParams.terms, variant: "caption" }, "Terms"))))));
};
export default EntryLayout;
