import * as restify from "restify";
import * as fs from "fs";
import * as path from "path";
import * as r from "request";

import {
  writeRASAFileObservable,
  deleteRASAFileObservable,
  withRASAData
} from "./files";
import { flatMap, map } from "rxjs/operators";
import { Observable, from } from "rxjs";
import { joinPath } from "./utils";
import { rasaTrainError, keyMissingError } from "./error";
import { Collection, APPS_COLLECTION } from "./mongo";
import { normalize } from "./files";
import { withJSON } from "./routes";
import { rasaURL } from "./server";

type RasaTrainingResponse = {
  info: string;
};

/**
 * We have to create a file because RASA is taking a .yml file as training input
 */
function rasaPostFile<T>(resource: string, fname: string): Observable<T> {
  return new Observable(subscriber => {
    let options: r.Options = {
      url: joinPath(rasaURL, resource),
      method: "POST",
      body: fs.createReadStream(path.resolve(__dirname, "../") + "/" + fname),
      headers: { "Content-Type": "application/x-yml" },
      encoding: null
    };
    r(options, (err, response, body) => {
      if (err) {
        console.error("error requesting RASA with path ", fname, ": ", err);
        subscriber.error(
          rasaTrainError(
            typeof err === "string" ? err : `error with training file ${fname}`
          )
        );
      } else {
        if (response && response.statusCode < 400) {
          let json = typeof body === "string" ? JSON.parse(body) : body;
          if (json) {
            subscriber.next(json as T);
          } else
            subscriber.error(
              rasaTrainError("unexpected response format (not JSON)")
            );
        } else
          subscriber.error(
            rasaTrainError(
              "bad response code " + response
                ? `( ${response.statusCode} )`
                : ""
            )
          );
      }
    });
  });
}

/**
 * Expected payload:
 * {
 *  "project": "myproject",
 *  "pipeline": [ "" ] // Or "" for template name
 *
 * }
 */
export default (server: restify.Server) => {
  server.post(
    "/rasa/models/train",
    (request: restify.Request, response: restify.Response) => {
      withJSON<{ project: string; model?: string }>(request, response, json => {
        if (typeof json.project === "string") {
          let model: string = json.model ? `&model=${json.model}` : "";
          let appCol = new Collection(APPS_COLLECTION);
          appCol
            .run(c => c.findOne({ _id: json.project }))
            .pipe(
              flatMap<any, any>(app =>
                withRASAData(json.project)
                  .pipe(
                    map(rasaTrainingData => ({ project: app.name, data: rasaTrainingData }) )
                  )
                  .pipe(
                    flatMap(rasaTrainingData =>
                      writeRASAFileObservable(rasaTrainingData)
                        .pipe(
                          flatMap(fname =>
                            rasaPostFile(
                              `/train?project=${normalize(
                                rasaTrainingData.project
                              )}${model}`,
                              fname
                            ).pipe(
                              map((rasaRes: RasaTrainingResponse) => ({
                                rasaRes,
                                fname
                              }))
                            )
                          )
                        )
                        .pipe(
                          map(obj => {
                            deleteRASAFileObservable(obj.fname);
                            return obj.rasaRes;
                          })
                        )
                    )
                  )
              )
            )
            .subscribe({
              next: (res: RasaTrainingResponse) => {
                response.send(200, res);
              },
              error: err =>
                typeof err === "object"
                  ? response.send(400, err)
                  : response.send(400, { error: "unknown" })
            });
        } else response.send(400, keyMissingError("project"));
      });
    }
  );

  server.get(
    "/rasa/models/status",
    (
      request: restify.Request,
      response: restify.Response,
    ) => {
      r({ url: joinPath(rasaURL, "status"), method: "GET", headers: { "Content-Type": "application/json" } }, (err, res, body) => {
        if (!err) {
          if (body) {
            let json = typeof body === 'string' ? JSON.parse(body) : body;
            response.send(200, json)
          } else response.send(500, rasaTrainError("empty answer from RASA"))
        } else response.send(500, rasaTrainError(`cannot get app status: ${err}`))
      })
    }
  );
};
