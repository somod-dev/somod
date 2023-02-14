import { getMiddlewareHandler } from "somod-middleware";
import lambdaFn from "../../../../build/serverless/functions/onconnect";
const handler = getMiddlewareHandler(lambdaFn, []);
export default handler;
