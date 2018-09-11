import * as restify from "restify";
import { withJSON, withQP } from "./routes";
import { ENTITY_COLLECTION, withId, quickCmd, MONGO_ID_RGXP, Collection, EXAMPLE_COLLECTION } from "./mongo";
import { wrongFormatError, mongoError } from "./error";
import { map, take, flatMap } from "rxjs/operators";
import { Example } from "./models";
import { withEntities } from "./utils";


export default (server: restify.Server) => {
  server.post(
    "/entities",
    (request: restify.Request, response: restify.Response) => {
      withJSON(request, response, json => {
        let examples = new Collection(EXAMPLE_COLLECTION);
        let entities = new Collection(ENTITY_COLLECTION);
        let newEntity = withId(json)
        examples.run<any[]>(c => c.find({ appId: newEntity.appId }).toArray()).pipe(
            map(docs => docs.map(doc => 
                new Example(doc)).map(ex => withEntities(newEntity.value, newEntity.synonyms, ex))
            ),
            map(updates => examples.run(c => c.updateMany({ $in: updates.map(u => u._id) }, updates))),
            flatMap<any, any>(_ => entities.run(c => c.insertOne(newEntity))),
            map(_ => newEntity),
            take(1)
        ).subscribe(ety => response.send(201, ety), err => response.send(400, mongoError(err)))
      });
    }
  );

  server.get(
    "/entities",
    (request: restify.Request, response: restify.Response) => {
      var selector = {};
      if (request.query) {
        let appId: string = request.query.appId;
        if (appId) {
          if (appId.match(MONGO_ID_RGXP)) {
            selector = { appId };
          }
          else wrongFormatError("id has wrong format")
        }
      }
      quickCmd(response, ENTITY_COLLECTION, c => c.find(selector).toArray());
    }
  );

  server.del(
    "/entities",
    (
      request: restify.Request,
      response: restify.Response,
      next: restify.Next
    ) => {
      withQP(request, response, ["entity"], entityId =>
        quickCmd(response, ENTITY_COLLECTION, c => c.remove({ _id: entityId }))
      );
    }
  );
};
