import { getMiddlewareHandler } from "somod-middleware";
import lambdaFn from "../../../../build/serverless/functions/ondisconnect";
const handler = getMiddlewareHandler(lambdaFn, []);
export default handler;
