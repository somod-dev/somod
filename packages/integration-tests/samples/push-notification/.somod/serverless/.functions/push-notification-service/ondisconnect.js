import { getMiddlewareHandler } from "somod-middleware";
import lambdaFn from "../../../../node_modules/push-notification-service/build/serverless/functions/ondisconnect";
const handler = getMiddlewareHandler(lambdaFn, []);
export default handler;
