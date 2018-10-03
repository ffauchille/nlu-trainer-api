import * as restify from "restify";
import { Category } from "./models";
import { CATEGORY_COLLECTION, quickCmd, withId, Collection } from "./mongo";
import { withClass, withQP } from "./routes";
import { map, take } from "rxjs/operators";
import { Observable } from "rxjs";
import { appByName$ } from "./applications";

export const categoryByName$ = (name: string): Observable<Category> => {
  let categories = new Collection(CATEGORY_COLLECTION);
  return categories.run(c => c.findOne({ name }));
};

export default (server: restify.Server) => {
  server.post(
    "/categories",
    (request: restify.Request, response: restify.Response) => {
      withClass<Category>(
        request,
        response,
        pl => new Category(withId(pl)),
        newCategory => {
          let categories = new Collection(CATEGORY_COLLECTION);
          categories
            .run(c => c.insertOne(newCategory))
            .pipe(
              map(_ => newCategory),
              take(1)
            )
            .subscribe(
              categoryCreated => response.send(201, categoryCreated),
              err => response.send(500, { error: err })
            );
        }
      );
    }
  );

  server.get(
    "/categories/byname",
    (request: restify.Request, response: restify.Response) => {
      withQP(request, response, ["appName"], appName => {
        appByName$(appName).pipe(
          map(app =>
            quickCmd(response, CATEGORY_COLLECTION, c =>
              c.find({ appId: app._id }).toArray()
            )
          )
        );
      });
    }
  );

  server.get(
    "/categories",
    (request: restify.Request, response: restify.Response) => {
      withQP(request, response, ["appId"], appId => {
        quickCmd(response, CATEGORY_COLLECTION, c =>
          c.find({ appId }).toArray()
        );
      });
    }
  );
};
