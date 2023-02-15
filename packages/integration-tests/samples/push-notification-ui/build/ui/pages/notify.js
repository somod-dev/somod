import { __assign } from "tslib";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useReducer } from "react";
import { notify } from "../../lib/notify";
var Notify = function () {
    var _a = useReducer(function (state, action) {
        var _a;
        return __assign(__assign({}, state), (_a = {}, _a[action.field] = action.data, _a));
    }, {
        message: "",
        userId: "",
        groupId: ""
    }), state = _a[0], dispatch = _a[1];
    var submit = function (e) {
        e.preventDefault();
        var data = {
            message: state.message,
            audience: {
                userId: state.userId || undefined,
                groupId: state.groupId || undefined
            }
        };
        notify(data).then(function (messageId) {
            dispatch({ field: "messageId", data: messageId });
        });
    };
    return (_jsxs("form", __assign({ style: {
            display: "flex",
            flexDirection: "column",
            maxWidth: "500px",
            fontFamily: "Roboto, Arial, sans-serif"
        } }, { children: [_jsx("h1", { children: "Publish a Message" }), _jsxs("div", __assign({ style: { display: "flex", flexDirection: "column", margin: "5px 0px" } }, { children: [_jsx("label", __assign({ htmlFor: "message" }, { children: "Message" })), _jsx("textarea", { name: "message", value: state.message, onChange: function (e) {
                            dispatch({ field: "message", data: e.target.value });
                        }, rows: 5 })] })), _jsxs("div", __assign({ style: { display: "flex", flexDirection: "column", margin: "5px 0px" } }, { children: [_jsx("label", __assign({ htmlFor: "userId" }, { children: "UserId" })), _jsx("input", { name: "userId", value: state.userId, onChange: function (e) {
                            dispatch({ field: "userId", data: e.target.value });
                        } })] })), _jsxs("div", __assign({ style: { display: "flex", flexDirection: "column", margin: "5px 0px" } }, { children: [_jsx("label", __assign({ htmlFor: "groupId" }, { children: "GroupId" })), _jsx("input", { name: "groupId", value: state.groupId, onChange: function (e) {
                            dispatch({ field: "groupId", data: e.target.value });
                        } })] })), _jsx("div", __assign({ style: { display: "flex", flexDirection: "column", margin: "5px 0px" } }, { children: state.messageId ? (_jsxs("h4", { children: ["Mesasge published with id ", _jsx("br", {}), state.messageId] })) : null })), _jsx("button", __assign({ onClick: submit, style: { margin: "5px 0px", padding: "5px" } }, { children: "Submit" }))] })));
};
export default Notify;
