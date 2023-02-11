import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useReducer, useEffect } from "react";
import { subscribe } from "push-notification-ui";
var Messages = function () {
    var _a = useReducer(function (state, data) {
        state.push(data);
        return state;
    }, []), messages = _a[0], addMessage = _a[1];
    useEffect(function () {
        subscribe(function (message) {
            addMessage(message);
        });
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx("h1", { children: "Messages" }), _jsx("ul", { children: messages.map(function (message, i) { return (_jsx("li", { children: JSON.stringify(message, null, 2) }, i)); }) })] }));
};
export default Messages;
