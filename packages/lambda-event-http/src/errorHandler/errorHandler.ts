import { HttpResponse } from "../types/types-http-lambda";
import { getStatusCode, InternalServerError, SolibError } from "@solib/errors";

export const errorHandler = (error: SolibError | Error): HttpResponse => {
  //careful - don't change the order of functions below
  if (!(error instanceof SolibError)) {
    //InternalServerError is of type SolibError
    error = new InternalServerError(error);
  }

  const response = solibErrorHandler(error as SolibError);

  if (response.statusCode == 500) {
    // eslint-disable-next-line no-console
    console.error(error);
    response.body = "Internal Server Error";
  }

  return response;
};

const solibErrorHandler = (solibError: SolibError): HttpResponse => {
  return {
    statusCode: getStatusCode(solibError),
    body: JSON.stringify(solibError.toObject())
  };
};
