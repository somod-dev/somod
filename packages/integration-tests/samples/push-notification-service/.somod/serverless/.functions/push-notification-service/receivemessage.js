import { getMiddlewareHandler } from "somod-middleware";
import lambdaFn from "../../../../build/serverless/functions/receivemessage";
const handler = getMiddlewareHandler(lambdaFn, []);
export default handler;
