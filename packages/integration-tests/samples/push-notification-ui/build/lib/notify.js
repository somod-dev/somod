import { __awaiter, __generator } from "tslib";
export var notify = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var res, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch(process.env.NEXT_PUBLIC_PNS_PUBLISH_ENDPOINT + "/notify", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "Content-Type": "application/json" }
                })];
            case 1:
                res = _a.sent();
                if (res.status != 200) {
                    throw new Error("Notify failed : " + res.status);
                }
                return [4 /*yield*/, res.json()];
            case 2:
                result = _a.sent();
                return [2 /*return*/, result.messageId];
        }
    });
}); };
