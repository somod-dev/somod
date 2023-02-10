import { __awaiter, __generator } from "tslib";
import { DynamoDB, ApiGatewayManagementApi } from "aws-sdk";
var ddb = new DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION
});
var apigwManagementApiConnections = {};
var getApigwManagementApi = function (endpoint) {
    if (apigwManagementApiConnections[endpoint] === undefined) {
        apigwManagementApiConnections[endpoint] = new ApiGatewayManagementApi({
            apiVersion: "2018-11-29",
            endpoint: endpoint
        });
    }
    return apigwManagementApiConnections[endpoint];
};
var getUsersOfGroup = function (groupId) { return __awaiter(void 0, void 0, void 0, function () {
    var usersOfGroup;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, ddb
                    .query({
                    TableName: process.env.USERS_TABLE_NAME,
                    IndexName: "byGroupId",
                    KeyConditionExpression: "groupId = :groupId",
                    ExpressionAttributeValues: {
                        ":groupId": groupId
                    }
                })
                    .promise()];
            case 1:
                usersOfGroup = _b.sent();
                return [2 /*return*/, (_a = (usersOfGroup.Items || [])) === null || _a === void 0 ? void 0 : _a.map(function (userOfGroup) { return userOfGroup.userId; })];
        }
    });
}); };
var listConnections = function () { return __awaiter(void 0, void 0, void 0, function () {
    var connections;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, ddb
                    .scan({
                    TableName: process.env.CONNECTIONS_TABLE_NAME
                })
                    .promise()];
            case 1:
                connections = _b.sent();
                return [2 /*return*/, (_a = (connections.Items || [])) === null || _a === void 0 ? void 0 : _a.map(function (connection) { return ({
                        connectionId: connection.connectionId,
                        userId: connection.userId
                    }); })];
        }
    });
}); };
var filterConnections = function (connections, users) {
    var usersMap = Object.fromEntries(users.map(function (u) { return [u, true]; }));
    return connections.filter(function (connection) { return usersMap[connection.userId]; });
};
var sendMessage = function (connectionId, message) { return __awaiter(void 0, void 0, void 0, function () {
    var apigwManagementApi, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                apigwManagementApi = getApigwManagementApi(process.env.CONNECTIONS_ENDPOINT);
                data = typeof message == "string" ? message : JSON.stringify(message);
                return [4 /*yield*/, apigwManagementApi
                        .postToConnection({ ConnectionId: connectionId, Data: data })
                        .promise()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleRecord = function (record) { return __awaiter(void 0, void 0, void 0, function () {
    var message, users, _a, _b, _c, connections, eligibleConnections, sendMessageResult;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                message = DynamoDB.Converter.unmarshall(((_d = record.dynamodb) === null || _d === void 0 ? void 0 : _d.NewImage) || {});
                users = [];
                if (!message.audience.userId) return [3 /*break*/, 1];
                users.push(message.audience.userId);
                return [3 /*break*/, 3];
            case 1:
                if (!message.audience.groupId) return [3 /*break*/, 3];
                _b = (_a = users.push).apply;
                _c = [users];
                return [4 /*yield*/, getUsersOfGroup(message.audience.groupId)];
            case 2:
                _b.apply(_a, _c.concat([(_e.sent())]));
                _e.label = 3;
            case 3: return [4 /*yield*/, listConnections()];
            case 4:
                connections = _e.sent();
                eligibleConnections = filterConnections(connections, users);
                return [4 /*yield*/, Promise.allSettled(eligibleConnections.map(function (connection) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, sendMessage(connection.connectionId, message.message)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }))];
            case 5:
                sendMessageResult = _e.sent();
                // eslint-disable-next-line no-console
                console.log(JSON.stringify({
                    messageId: message.messageId,
                    audience: message.audience,
                    noOfEligibleUsers: users.length,
                    noOfEligibleConnections: eligibleConnections.length,
                    noOfFailedConnections: sendMessageResult.filter(function (result) { return result.status == "rejected"; }).length
                }));
                return [2 /*return*/];
        }
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
