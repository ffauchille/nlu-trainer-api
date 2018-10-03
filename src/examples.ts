import * as restify from "restify";
import { withJSON, withQP } from "./routes";
import {
  quickCmd,
  EXAMPLE_COLLECTION,
  withId,
  Collection,
  INTENT_COLLECTION,
  ENTITY_COLLECTION
} from "./mongo";
import { flatMap, map, take } from "rxjs/operators";
import { keyMissingError } from "./error";
import { withEntities } from "./utils";
import { appEntities$ } from "./entities";

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
      withJSON<any>(request, response, json => {
        let newExample = withId(json);
        appEntities$(json.intentId)
          .pipe(
            map((entities: any[]) => {
              let exampleWithEntities = entities.reduce(
                (example, entitiyDef) =>
                  withEntities(entitiyDef.value, entitiyDef.synonyms, example),
                newExample
              );
              return exampleWithEntities;
            }),
            flatMap(ex => {
              let examplesCol = new Collection(EXAMPLE_COLLECTION);
              return examplesCol.run(c => c.insertOne(ex)).pipe(map(_ => ex));
            }),
            take(1)
          )
          .subscribe(
            exInserted => response.send(201, exInserted),
            err => response.send(500, { error: err })
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
          selector = { ...selector, intentId: request.query.intent };
        }
      }
      quickCmd(response, EXAMPLE_COLLECTION, c => c.find(selector).toArray());
    }
  );

  server.del(
    "/examples",
    (
      request: restify.Request,
      response: restify.Response,
      next: restify.Next
    ) => {
      withQP(request, response, ["example"], exampleId => {
        quickCmd(response, EXAMPLE_COLLECTION, c =>
          c.remove({ _id: exampleId })
        );
      });
    }
  );
};
