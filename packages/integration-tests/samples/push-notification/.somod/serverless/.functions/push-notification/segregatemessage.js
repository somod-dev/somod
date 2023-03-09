import { getMiddlewareHandler } from "somod-middleware";
import lambdaFn from "../../../../build/serverless/functions/segregatemessage";
const handler = getMiddlewareHandler(lambdaFn, []);
export default handler;
