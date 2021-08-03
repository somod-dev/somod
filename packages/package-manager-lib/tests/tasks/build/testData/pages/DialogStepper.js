import { __assign, __rest } from "tslib";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, makeStyles, useTheme } from "@material-ui/core";
import * as React from "react";
import { CSSTransition, SwitchTransition } from "react-transition-group";
var useStyles = makeStyles(function (theme) { return ({
    container: {
        overflowX: "hidden",
        "& .fade-enter": {
            opacity: 0
        },
        "& .fade-enter-active": {
            opacity: 1
        },
        "& .fade-exit": {
            opacity: 1
        },
        "& .fade-exit-active": {
            opacity: 0
        },
        "& .slide-enter": {
            opacity: 0,
            transform: "translate(100%)"
        },
        "&.backward .slide-enter": {
            opacity: 0,
            transform: "translate(-100%)"
        },
        "& .slide-enter-active": {
            opacity: 1,
            transform: "translate(0%)"
        },
        "& .slide-exit": {
            opacity: 1,
            transform: "translate(0%)"
        },
        "& .slide-exit-active": {
            opacity: 0,
            transform: "translate(-100%)"
        },
        "&.backward .slide-exit-active": {
            opacity: 0,
            transform: "translate(100%)"
        }
    },
    step: {
        transitionProperty: "all",
        transitionDuration: theme.transitions.duration.standard + "ms"
    }
}); });
var DialogStepper = function (_a) {
    var step = _a.step, title = _a.title, children = _a.children, back = _a.back, next = _a.next, props = __rest(_a, ["step", "title", "children", "back", "next"]);
    var _b = React.useState("forward"), direction = _b[0], setDirection = _b[1];
    var theme = useTheme();
    var classes = useStyles();
    return (React.createElement(Dialog, __assign({}, props),
        React.createElement(DialogTitle, { className: classes.container + " " + direction },
            React.createElement(SwitchTransition, null,
                React.createElement(CSSTransition, { key: step, classNames: "fade", timeout: theme.transitions.duration.standard },
                    React.createElement("div", { className: classes.step }, title)))),
        React.createElement(DialogContent, { className: classes.container + " " + direction },
            React.createElement(SwitchTransition, null,
                React.createElement(CSSTransition, { key: step, classNames: "slide", timeout: theme.transitions.duration.standard },
                    React.createElement("div", { className: classes.step }, children)))),
        React.createElement(DialogActions, null,
            props.onClose ? (React.createElement(React.Fragment, null,
                React.createElement(Button, { onClick: function (e) {
                        props.onClose(e, "backdropClick");
                    } }, "Cancel"),
                React.createElement("div", { style: { flex: "1 0 0" } }))) : null,
            React.createElement(Button, { color: "secondary", disabled: back.disabled, onClick: function () {
                    setDirection("backward");
                    back.on();
                }, variant: back.variant }, back.label || "Back"),
            React.createElement(Button, { color: "primary", disabled: next.disabled, onClick: function () {
                    setDirection("forward");
                    next.on();
                }, variant: next.variant }, next.label || "Next"))));
};
export default DialogStepper;
