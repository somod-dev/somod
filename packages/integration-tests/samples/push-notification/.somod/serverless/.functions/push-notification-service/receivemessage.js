import { getMiddlewareHandler } from "somod-middleware";
import lambdaFn from "../../../../node_modules/push-notification-service/build/serverless/functions/receivemessage";
const handler = getMiddlewareHandler(lambdaFn, []);
export default handler;
