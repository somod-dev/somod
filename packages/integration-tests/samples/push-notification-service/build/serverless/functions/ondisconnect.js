import { __awaiter, __generator } from "tslib";
import { DynamoDB } from "aws-sdk";
var ddb = new DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION
});
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ddb
                        .delete({
                        TableName: process.env.TABLE_NAME,
                        Key: {
                            connectionId: event.requestContext.connectionId
                        }
                    })
                        .promise()];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                return [2 /*return*/, {
                        statusCode: 500,
                        body: "Failed to disconnect: " + JSON.stringify(err_1)
                    }];
            case 3: return [2 /*return*/, { statusCode: 200, body: "Disconnected." }];
        }
    });
}); };
export default handler;
