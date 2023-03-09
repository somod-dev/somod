import { getMiddlewareHandler } from "somod-middleware";
import lambdaFn from "../../../../build/serverless/functions/sendmessage";
const handler = getMiddlewareHandler(lambdaFn, []);
export default handler;
