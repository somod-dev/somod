const authorizer = event => {
  return {
    isAuthorized: true,
    context: {
      id: "dummy",
      route: event.request.routekey
    }
  };
};
