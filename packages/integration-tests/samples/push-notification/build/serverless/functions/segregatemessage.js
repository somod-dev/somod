import { __awaiter, __generator } from "tslib";
import { DynamoDB } from "aws-sdk";
var ddb = new DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION
});
var handleRecord = function (record) { return __awaiter(void 0, void 0, void 0, function () {
    var message;
    var _a;
    return __generator(this, function (_b) {
        message = DynamoDB.Converter.unmarshall(((_a = record.dynamodb) === null || _a === void 0 ? void 0 : _a.NewImage) || {});
        if (typeof message.message["type"] === "string") {
            ddb.put({
                TableName: process.env.MESSAGE_TYPE_TABLE_NAME,
                Item: {
                    type: message.message["type"],
                    messageId: message.messageId
                }
            });
        }
        return [2 /*return*/];
    });
}); };
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, _a, record;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _i = 0, _a = event.Records;
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                record = _a[_i];
                if (!(record.eventName == "INSERT")) return [3 /*break*/, 3];
                return [4 /*yield*/, handleRecord(record)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
export default handler;
