import * as restify from "restify";
import { writeRASAFileObservable, deleteRASAFileObservable } from "./files";
import { flatMap, map } from "rxjs/operators";
import { Observable } from "../node_modules/rxjs";
import * as request from "request";
import { joinPath } from "./utils";
import { APIError } from "./error";

type RasaTrainingResponse = {
  info: string
}

const baseUrl = process.env.RASA_ENDPOINT || "http://localhost:5000"

const rasaTrainError = (msg: string) => ( { type: "RASA", err: new Error(`error posting training file ${msg}`) })
export const keyMissingError = (missingKey: string): APIError => ({
  type: "RASA",
  err: new Error(`Bad format, missing ${missingKey}`)
});

function rasaPostFile<T>(resource: string, path: string): Observable<T> {
  return new Observable(subscriber => {
    let options: request.Options = {
      url: joinPath(baseUrl, resource),
      method: "POST",
      headers: { "Accept": "application/json" },
      body: path
    }
    request(options, (err, response, body) => {
      if (err) {
        console.error("error requesting RASA with path ", path, ": ", err)
        subscriber.error(rasaTrainError(typeof err === "string" ? err : `error with training file ${path}`))
      } else {
        if (response && response.statusCode < 400 ) {
          let json = typeof body === "string" ? JSON.parse(body) : body
          if (json) {
            subscriber.next(json as T)
          } else subscriber.error(rasaTrainError("unexpected response format (not JSON)"))
        } else subscriber.error(rasaTrainError("bad response code " + response ? `( ${response.statusCode} )` : ""))
      }
    })
  })
}

/**
 * Expected payload:
 * {
 *  "name": "myfile.md",
 *  "project": "myproject",
 *  "pipeline": [ "" ] // Or "" for template name
 *  
 * }
 */
export default (server: restify.Server) => {
  server.post(
    "/rasa/models/train",
    (
      request: restify.Request,
      response: restify.Response
    ) => {
      if (request.body) {
        let json = typeof request.body === "string" ? JSON.parse(request.body) : request.body
        if (json) {
          if (json.project) {
            let model: string = json.model ? `&model=${json.model}` : ""; 
            writeRASAFileObservable(json).pipe(
              flatMap(fname => 
                rasaPostFile(`/train?project=${json.project}${model}`, fname).pipe(
                  map( (rasaRes: RasaTrainingResponse) => ({ rasaRes, fname }))
                ))
            ).pipe(
              map( obj => {
                deleteRASAFileObservable(obj.fname)
                return obj.rasaRes
              })
            ).subscribe({
              next: (res: RasaTrainingResponse) => { response.send(200, res) },
              error: err => typeof err === "object" ? response.send(400, err) : response.send(400, { error: "unknown" })
            })
          } else response.send(400, keyMissingError("project"))
        }
      } else response.send(400, { error: "expected JSON body" })
    }
  )
}
