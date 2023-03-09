export var subscribe = function (cb, subProtocols) {
    return new Promise(function (resolve, reject) {
        var ws = new WebSocket(process.env.NEXT_PUBLIC_PNS_SUBSCRIBE_ENDPOINT, subProtocols);
        ws.addEventListener("open", function () {
            ws.addEventListener("message", function (e) {
                cb(e.data);
            });
            resolve(ws);
        });
        ws.addEventListener("error", function (e) {
            reject(e);
        });
    });
};
