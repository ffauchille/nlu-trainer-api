import * as restify from "restify";
import appsRoutes from "./applications";
import categoriesRoutes from "./categories";
import entitiesRoutes from "./entities";
import { missingQP, wrongFormatError } from "./error";
import exampleRoutes from "./examples";
import intentsRoutes from "./intents";
import rasaRoutes from "./rasa";
import testsuiteRoutes from "./testsuite";

function jsonBody<T>(
  request: restify.Request,
  response: restify.Response,
  cb: (json: T | T[]) => void,
  extraCheck?: (json: T | T[]) => boolean
) {
  if (request.body) {
    let json =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body;
    if (json && extraCheck) {
      cb(json);
      extraCheck(json)
        ? cb(json)
        : response.send(400, wrongFormatError("didn't passed extra checks"));
    } else cb(json);
  } else response.send(400, wrongFormatError("it's not a JSON parsable body"));
}

export function withJSON<T>(
  request: restify.Request,
  response: restify.Response,
  cb: (j: T) => void
): void {
  jsonBody(request, response, cb, json => !(json instanceof Array));
}

export function withClass<T extends Object>(
  request: restify.Request,
  response: restify.Response,
  construct: (pl: any) => T,
  cb: (instance: T) => void
): void {
  jsonBody<T>(request, response, pl => cb(construct(pl)));
}

export function withJSONArray<T>(
  request: restify.Request,
  response: restify.Response,
  cb: (jsons: T[]) => void
) {
  jsonBody(request, response, cb, jsons => jsons instanceof Array);
}

export function withQP(
  request: restify.Request,
  response: restify.Response,
  params: string[],
  cb: (...params: string[]) => void
) {
  if (request.query) {
    let queryParams: string[] = [];
    let missing: string[] = [];
    params.forEach(p => {
      let found = request.query[p];
      if (found) {
        queryParams.push(found);
      } else missing.push(p);
    });
    if (missing.length > 0) {
      response.send(400, missingQP(missing));
    } else cb(...queryParams);
  } else response.send(400, missingQP(params));
}

export default server => {
  rasaRoutes(server);
  intentsRoutes(server);
  entitiesRoutes(server);
  appsRoutes(server);
  exampleRoutes(server);
  testsuiteRoutes(server);
  categoriesRoutes(server);
};
