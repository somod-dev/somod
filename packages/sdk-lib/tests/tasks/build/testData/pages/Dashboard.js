import { Grid, Typography, AppBar, Toolbar, IconButton, useMediaQuery, Drawer, Backdrop, Fab, Box } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import MenuOpenIcon from "@material-ui/icons/MenuOpen";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import * as React from "react";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
var BackToTop = function (_a) {
    var right = _a.right, bottom = _a.bottom, zIndex = _a.zIndex, scrollRef = _a.scrollRef;
    var _b = React.useState(0), scrollTop = _b[0], setScrollTop = _b[1];
    var _c = React.useState(false), listening = _c[0], setListening = _c[1];
    var initialPosition = -100 + bottom;
    var multiplicationFactor = 0.5;
    var newPosition = scrollTop * multiplicationFactor + initialPosition;
    if (newPosition > bottom) {
        newPosition = bottom;
    }
    React.useEffect(function () {
        if (!listening && scrollRef.current) {
            scrollRef.current.addEventListener("scroll", function (e) {
                var target = e.target;
                if (target.scrollHeight >
                    target.offsetHeight +
                        56 - // consider titleBar hiding in mobile browser
                        initialPosition / multiplicationFactor) {
                    setScrollTop(target.scrollTop);
                }
            });
            setListening(true);
        }
    }, [scrollRef.current]);
    return (React.createElement(Fab, { style: {
            position: "fixed",
            right: right,
            bottom: newPosition,
            zIndex: zIndex
        }, size: "medium", color: "secondary", onClick: function () {
            if (scrollRef && scrollRef.current) {
                var step_1 = scrollRef.current.scrollTop / 150;
                // eslint-disable-next-line no-undef
                var intervalId_1 = setInterval(function () {
                    if (scrollRef.current.scrollTop === 0) {
                        // eslint-disable-next-line no-undef
                        clearInterval(intervalId_1);
                    }
                    else {
                        scrollRef.current.scrollTop += -1 * step_1;
                    }
                }, 2);
            }
        } },
        React.createElement(KeyboardArrowUpIcon, null)));
};
var drawerWidth = 240;
var useStyles = makeStyles(function (theme) { return ({
    appBar: {
        zIndex: theme.zIndex.drawer + 1
    },
    menuButton: {
        marginRight: theme.spacing(2)
    },
    title: {
        flexGrow: 1
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0
    },
    drawerPaper: {
        width: drawerWidth
    },
    drawerContainer: {
        overflow: "auto"
    },
    content: {
        position: "relative",
        flexGrow: 1,
        transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        marginLeft: drawerWidth,
        minHeight: 0,
        "& > div#innerContent": {
            height: "calc(100vh - " + theme.spacing(8) + "px)",
            overflow: "auto",
            transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen
            }),
            width: "calc(100vw - " + drawerWidth + "px)"
        },
        "& .MuiBackdrop-root": {
            position: "absolute",
            zIndex: theme.zIndex.drawer - 1
        }
    },
    contentShift: {
        transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        }),
        marginLeft: 0,
        "& > div#innerContent": {
            transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen
            }),
            width: "100vw"
        }
    }
}); });
var Dashboard = function (_a) {
    var color = _a.color, title = _a.title, actions = _a.actions, menu = _a.menu, children = _a.children;
    var classes = useStyles();
    var theme = useTheme();
    var isLarge = useMediaQuery(theme.breakpoints.up("lg"));
    var isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    var _b = React.useState({
        state: !!menu,
        by: "default"
    }), drawerOpen = _b[0], setDrawerOpen = _b[1];
    var scrollableContent = React.createRef();
    if (isSmall && drawerOpen.by == "default" && drawerOpen.state) {
        setDrawerOpen({ state: false, by: "default" });
    }
    return (React.createElement(Grid, { container: true, direction: "column", alignItems: "stretch", style: { height: "100vh" } },
        React.createElement(AppBar, { position: "static", className: classes.appBar, color: color },
            React.createElement(Toolbar, null,
                menu && !isLarge ? (React.createElement(IconButton, { edge: "start", className: classes.menuButton, color: "inherit", "aria-label": "menu", onClick: function () {
                        setDrawerOpen({ state: !drawerOpen.state, by: "user" });
                    } }, drawerOpen.state ? React.createElement(MenuOpenIcon, null) : React.createElement(MenuIcon, null))) : (""),
                React.createElement(Typography, { variant: "h6", className: classes.title }, title),
                actions)),
        React.createElement(Drawer, { open: drawerOpen.state, anchor: "left", variant: "persistent", className: classes.drawer, classes: {
                paper: classes.drawerPaper
            } },
            React.createElement(Toolbar, null),
            React.createElement("div", { className: classes.drawerContainer, onClick: function () {
                    if (isSmall) {
                        setDrawerOpen({ state: !drawerOpen.state, by: "user" });
                    }
                } }, menu)),
        React.createElement(Grid, { className: !isSmall && drawerOpen.state
                ? classes.content
                : classes.content + " " + classes.contentShift },
            React.createElement("div", { id: "innerContent", ref: scrollableContent },
                children,
                isSmall ? (React.createElement(Box, { style: { height: theme.spacing(6) } },
                    React.createElement(BackToTop, { right: theme.spacing(1), bottom: theme.spacing(1), zIndex: theme.zIndex.appBar + 1, scrollRef: scrollableContent }))) : ("")),
            React.createElement(Backdrop, { open: isSmall && drawerOpen.state, onClick: function () {
                    setDrawerOpen({ state: false, by: "user" });
                } }))));
};
export default Dashboard;
