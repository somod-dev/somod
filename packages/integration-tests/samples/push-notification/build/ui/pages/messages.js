import { __assign, __spreadArray } from "tslib";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useReducer, useEffect } from "react";
import { subscribe } from "push-notification-ui";
var Messages = function () {
    var _a = useReducer(function (state, data) {
        return __spreadArray(__spreadArray([], state, true), [data], false);
    }, []), messages = _a[0], addMessage = _a[1];
    useEffect(function () {
        subscribe(function (message) {
            addMessage(message);
        });
    }, []);
    return (_jsxs("div", __assign({ style: { fontFamily: "Roboto, Arial, sans-serif" } }, { children: [_jsx("h1", { children: "Messages" }), _jsx("ul", { children: messages.map(function (message, i) { return (_jsx("li", { children: _jsx("pre", { children: JSON.stringify(message, null, 2) }) }, i)); }) })] })));
};
export default Messages;
