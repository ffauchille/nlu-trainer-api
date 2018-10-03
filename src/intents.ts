import * as restify from "restify";
import { wrongFormatError } from "./error";
import {
  INTENT_COLLECTION,
  MONGO_ID_RGXP,
  quickCmd,
  withId,
  Collection,
  APPS_COLLECTION,
  CATEGORY_COLLECTION
} from "./mongo";
import { withJSON, withQP } from "./routes";
import { map, flatMap } from "rxjs/operators";
import { AppModel, Category } from "./models";
import { Observable } from "rxjs";
import { appByName$ } from "./applications";
import { categoryByName$ } from "./categories";

type Intent = {
  _id: string;
  categoryId: string;
  name: string;
};

export default (server: restify.Server) => {
  server.post(
    "/intents",
    (request: restify.Request, response: restify.Response) => {
      withJSON(request, response, json => {
        quickCmd(response, INTENT_COLLECTION, c => c.insertOne(withId(json)));
      });
    }
  );

  server.get(
    "/intents",
    (request: restify.Request, response: restify.Response) => {
      withQP(request, response, ["categoryId"], categoryId => {
        if (categoryId.match(MONGO_ID_RGXP)) {
          quickCmd(response, INTENT_COLLECTION, c =>
            c.find({ categoryId }).toArray()
          );
        } else response.send(400, wrongFormatError("wrong ID format"));
      });
    }
  );
  server.get(
    "/intents/byname",
    (req: restify.Request, res: restify.Response, next: restify.Next) => {
      withQP(req, res, ["appName", "categoryName"], (appName, categoryName) => {
        appByName$(appName).pipe(
          flatMap(app =>
            categoryByName$(categoryName).pipe(
              map(category =>
                quickCmd(res, INTENT_COLLECTION, c =>
                  c.find({ appId: app._id, categoryId: category._id }).toArray()
                )
              )
            )
          )
        );
      });
    }
  );

  server.del(
    "/intents",
    (
      request: restify.Request,
      response: restify.Response,
      next: restify.Next
    ) => {
      withQP(request, response, ["intent"], intentId =>
        quickCmd(response, INTENT_COLLECTION, c => c.remove({ _id: intentId }))
      );
    }
  );
};
