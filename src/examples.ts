import * as restify from "restify";
import { withJSON } from "./routes";
import { runCmd, EXAMPLE_COLLECTION, withId } from "./mongo";

type Entity = {
  start: number;
  end: number;
  value: string;
  entity: string;
};

type Example = {
  text: string;
  intent: string;
  entities: Entity[];
};

type AppExample = {
  app: string;
  examples: Example[];
};

export default (server: restify.Server) => {
  server.post(
    "/examples",
    (request: restify.Request, response: restify.Response) => {
      withJSON<AppExample>(request, response, json => {
        runCmd(response, EXAMPLE_COLLECTION, c =>
          c.insertMany(
            json.examples.map(j => ({ app: json.app, ...withId(j) }))
          )
        );
      });
    }
  );

  server.get(
    "/examples",
    (
      request: restify.Request,
      response: restify.Response
    ) => {
      var selector = {};
      if (request.query) {
        if (request.query.app) {
          selector = { app: request.query.app };
        }
        if (request.query.intent) {
          selector = { ...selector, intent: request.query.intent };
        }
      }
      runCmd(response, EXAMPLE_COLLECTION, c => c.find(selector).toArray());
    }
  );
};
