import { __awaiter, __generator } from "tslib";
import { DynamoDB } from "aws-sdk";
import fetch from "node-fetch";
var ddb = new DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION
});
var authenticate = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var url, token, res, content;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(process.env.AUTH_END_POINT && event.headers)) return [3 /*break*/, 5];
                url = process.env.AUTH_END_POINT;
                token = event.headers["sec-websocket-protocol"];
                return [4 /*yield*/, fetch(url, {
                        headers: { Authorization: "Bearer " + token }
                    })];
            case 1:
                res = _a.sent();
                if (!(res.status == 200)) return [3 /*break*/, 3];
                return [4 /*yield*/, res.json()];
            case 2:
                content = _a.sent();
                return [2 /*return*/, content];
            case 3: throw new Error("Unauthorized");
            case 4: return [3 /*break*/, 6];
            case 5: throw new Error("Unauthorized");
            case 6: return [2 /*return*/];
        }
    });
}); };
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var authResult, e_1, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, authenticate(event)];
            case 1:
                authResult = _a.sent();
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                // eslint-disable-next-line no-console
                console.error(e_1);
                return [2 /*return*/, {
                        statusCode: 401
                    }];
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, ddb
                        .transactWrite({
                        TransactItems: [
                            {
                                Put: {
                                    TableName: process.env.CONNECTIONS_TABLE_NAME,
                                    Item: {
                                        connectionId: event.requestContext.connectionId,
                                        userId: authResult.id
                                    }
                                }
                            },
                            {
                                Put: {
                                    TableName: process.env.USERS_TABLE_NAME,
                                    Item: authResult
                                }
                            }
                        ]
                    })
                        .promise()];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                err_1 = _a.sent();
                return [2 /*return*/, {
                        statusCode: 500,
                        body: "Failed to connect: " + JSON.stringify(err_1)
                    }];
            case 6: return [2 /*return*/, { statusCode: 200, body: "Connected." }];
        }
    });
}); };
export default handler;
