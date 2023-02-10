import { __assign } from "tslib";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useReducer } from "react";
import { notify } from "../../lib/notify";
var Notify = function () {
    var _a = useReducer(function (state, action) {
        switch (action.type) {
            case "setMessage":
                state.message = action.data;
                break;
            case "setUserId":
                state.userId = action.data;
                break;
            case "setGroupId":
                state.groupId = action.data;
                break;
            case "setMessageId":
                state.messageId = action.data;
        }
        return state;
    }, {
        message: "",
        userId: "",
        groupId: ""
    }), state = _a[0], dispatch = _a[1];
    var submit = function () {
        var data = {
            message: state.message,
            audience: {
                userId: state.userId || undefined,
                groupId: state.groupId || undefined
            }
        };
        notify(data).then(function (messageId) {
            dispatch({ type: "setMessageId", data: messageId });
        });
    };
    return (_jsxs("form", { children: [_jsx("h1", { children: "Publish a Message" }), _jsx("label", __assign({ htmlFor: "message" }, { children: "Message" })), _jsx("textarea", { name: "message", value: state.message, onChange: function (e) {
                    dispatch({ type: "setMessage", data: e.target.value });
                } }), _jsx("label", __assign({ htmlFor: "userId" }, { children: "UserId" })), _jsx("input", { name: "userId", value: state.userId, onChange: function (e) {
                    dispatch({ type: "setUserId", data: e.target.value });
                } }), _jsx("label", __assign({ htmlFor: "groupId" }, { children: "GroupId" })), _jsx("input", { name: "groupId", value: state.groupId, onChange: function (e) {
                    dispatch({ type: "setGroupId", data: e.target.value });
                } }), state.messageId ? (_jsxs("h4", { children: ["Mesasge published with id ", state.messageId] })) : null, _jsx("button", __assign({ onClick: submit }, { children: "Submit" }))] }));
};
export default Notify;
