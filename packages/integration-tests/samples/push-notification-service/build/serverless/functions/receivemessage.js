import { __awaiter, __generator } from "tslib";
import { DynamoDB } from "aws-sdk";
import { v1 } from "uuid";
var ddb = new DynamoDB({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION
});
var TABLE_NAME = process.env.TABLE_NAME;
var API_KEY = process.env.API_KEY;
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var body, messageId;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                // authentication
                if (event.headers["authorization"] !== API_KEY) {
                    return [2 /*return*/, { statusCode: 401 }];
                }
                body = JSON.parse(event.body || "{}");
                if ((body === null || body === void 0 ? void 0 : body.message) === undefined || (body === null || body === void 0 ? void 0 : body.audience) === undefined) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                error: "must have 'message' and 'audience' properties in the body"
                            }),
                            headers: { "Content-Type": "application/json" }
                        }];
                }
                if (((_a = body.audience) === null || _a === void 0 ? void 0 : _a.userId) === undefined &&
                    ((_b = body.audience) === null || _b === void 0 ? void 0 : _b.facilityId) === undefined) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                error: "audience property must have 'userId' or 'facilityId'"
                            }),
                            headers: { "Content-Type": "application/json" }
                        }];
                }
                messageId = v1();
                return [4 /*yield*/, ddb
                        .putItem({
                        TableName: TABLE_NAME,
                        Item: DynamoDB.Converter.marshall({
                            messageId: messageId,
                            message: body.message,
                            audience: body.audience
                        })
                    })
                        .promise()];
            case 1:
                _c.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify({ messageId: messageId }),
                        headers: { "Content-Type": "application/json" }
                    }];
        }
    });
}); };
export default handler;
