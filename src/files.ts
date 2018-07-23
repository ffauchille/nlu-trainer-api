import * as fs from "fs";
import { Observable, of, Subscriber } from "rxjs";
import { APIError } from "./error";
import { keyMissingError } from "./rasa";

type PATH = string;

const newLines = (lines: string[], prefix?: string) => lines.slice(1, lines.length).reduce((d, line) => `\n${prefix ? prefix : ""}` + line, lines[0])

export const deleteRASAFileObservable = (fname: string): Observable<boolean> => {
  return new Observable<boolean>((subscriber: Subscriber<boolean>) => {
    fs.unlinkSync(fname)
    subscriber.next(true)
  })
}

export const writeRASAFileObservable = (json: any): Observable<PATH> => {
  return new Observable<PATH>((subscriber: Subscriber<PATH>) => {
    var fname: string = "";
    var data: string = "";
    // headers
    data += "language: " + (json.language ? `"${json.language}"` : "\"en\"")
    if (json.pipeline) {
      data += "\n" + (typeof json.pipeline === "string" ? `pipeline: "${json.pipeline}"` : `pipeline:\n${newLines(json.pipeline.map(e => `"${e}"`), "  - name: ")}`)
    } else data += "\npipeline: \"spacy_sklearn\"";

    // data 
    data += "\ndata: "
    if (json.data) {
      data += JSON.stringify(json.data, null, 2);
    } else subscriber.error(keyMissingError("data"));

    // file name
    if (json.project) {
      fname += json.project;
    } else subscriber.error(keyMissingError("project"));
    if (json.model) {
      fname += "-" + json.model;
    } else fname += "-" + new Date().toDateString();

    fname += ".json.yml"
    fname = "./data/" + fname
    fs.writeFileSync(fname, data);
    
    subscriber.next(fname);
  });
};
