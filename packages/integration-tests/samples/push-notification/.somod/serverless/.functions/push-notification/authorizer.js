import { getMiddlewareHandler } from "somod-middleware";
import lambdaFn from "../../../../build/serverless/functions/authorizer";
const handler = getMiddlewareHandler(lambdaFn, []);
export default handler;
