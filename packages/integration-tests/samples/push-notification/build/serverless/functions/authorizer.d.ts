declare const authorizer: (event: any) => {
    isAuthorized: boolean;
    context: {
        id: string;
        route: any;
    };
};
export default authorizer;
