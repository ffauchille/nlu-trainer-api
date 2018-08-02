import * as restify from "restify";
import { withJSON } from "./routes";
import { quickCmd, EXAMPLE_COLLECTION, withId } from "./mongo";

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
        quickCmd(response, EXAMPLE_COLLECTION, c =>
          c.insertOne({ ...withId(json) })
        );
      });
    }
  );

  server.get(
    "/examples",
    (request: restify.Request, response: restify.Response) => {
      var selector = {};
      if (request.query) {
        if (request.query.intent) {
          selector = { ...selector, intent: request.query.intent };
        }
      }
      quickCmd(response, EXAMPLE_COLLECTION, c => c.find(selector).toArray());
    }
  );
};
