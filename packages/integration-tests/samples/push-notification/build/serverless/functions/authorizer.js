var authorizer = function (event) {
    return {
        isAuthorized: true,
        context: {
            id: "dummy",
            route: event.request.routekey
        }
    };
};
export default authorizer;
