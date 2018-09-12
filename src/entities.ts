import * as restify from "restify";
import { withJSON, withQP } from "./routes";
import { ENTITY_COLLECTION, withId, quickCmd, MONGO_ID_RGXP, Collection, EXAMPLE_COLLECTION, INTENT_COLLECTION } from "./mongo";
import { wrongFormatError, mongoError } from "./error";
import { map, take, flatMap, tap } from "rxjs/operators";
import { Example } from "./models";
import { withEntities } from "./utils";
import { Observable } from "rxjs";


const appExamples$ = (appId: string): Observable<Example[]> => {
  let intents = new Collection(INTENT_COLLECTION);
  let examples = new Collection(EXAMPLE_COLLECTION);
  return intents.run(c => c.find({ appId }).toArray())
                .pipe(
                  map<any[], string[]>(docs => docs.map(doc => doc._id)),
                  flatMap<string[], any[]>(ids => examples.run<any[]>(c => c.find({ intentId: { $in: ids }}).toArray())),
                  map<any[], Example[]>(docs => docs.map(doc => new Example(doc)))
                )
}

export default (server: restify.Server) => {
  server.post(
    "/entities",
    (request: restify.Request, response: restify.Response) => {
      withJSON(request, response, json => {
        let examples = new Collection(EXAMPLE_COLLECTION);
        let entities = new Collection(ENTITY_COLLECTION);
        let newEntity = withId(json)
        appExamples$(newEntity.appId).pipe(
            map<any[], Example[]>(exs => exs.reduce<Example[]>((updts, ex) => { 
                let exWithEntities = withEntities(newEntity.value, newEntity.synonyms, ex)
                return ex.entities.length !== exWithEntities.entities.length ? updts.concat(exWithEntities) : updts
              }, [])
            ),
            // TODO: unordered batch mongo update
            tap(updates => 
              updates.forEach(u =>
                examples.run(cl => cl.updateOne({ _id: u._id }, { $set: { entities: u.entities }})).pipe(take(1)).subscribe()
              )
            ),
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
