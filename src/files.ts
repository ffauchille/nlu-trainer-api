import * as fs from "fs";
import { Observable, Subscriber, of } from "rxjs";
import { keyMissingError } from "./error";
import {
  Collection,
  INTENT_COLLECTION,
  EXAMPLE_COLLECTION,
  ENTITY_COLLECTION
} from "./mongo";
import { flatMap, map } from "rxjs/operators";
import {
  RASATrainingData,
  EntityInExample,
  EntityDefinition,
  Example
} from "./models";
import csv from "csv-parser";

type PATH = string;

const newLines = (lines: string[], prefix?: string) =>
  lines
    .slice(1, lines.length)
    .reduce((d, line) => (d += `\n${prefix || ""}` + line), lines[0]);
const twoDigits = (n: number): string =>
  n.toString().length === 1 ? "0" + n.toString() : n.toString();
const formatDate = (d: Date): string =>
  `${d.getFullYear()}${twoDigits(d.getMonth() + 1)}${twoDigits(
    d.getDate()
  )}-${twoDigits(d.getHours())}${twoDigits(d.getMinutes())}${twoDigits(
    d.getSeconds()
  )}`;
export const normalize = (fname: string): string =>
  fname.toLowerCase().replace(" ", "_");

export const deleteRASAFileObservable = (
  fname: string
): Observable<boolean> => {
  return new Observable<boolean>((subscriber: Subscriber<boolean>) => {
    fs.unlinkSync(fname);
    subscriber.next(true);
  });
};

export function parseCSV$<T>(filePath: string): Observable<T[]> {
  return Observable.create(sub => {
    let read: T[] = [];
    return fs
      .createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", read.push)
      .on("end", () => sub.next(read));
  });
}

export const writeRASAFileObservable = (json: any): Observable<PATH> => {
  return new Observable<PATH>((subscriber: Subscriber<PATH>) => {
    var fname: string = "";
    var data: string = "";
    // headers
    data += "language: " + (json.language ? `"${json.language}"` : '"en"');
    data += "\n";
    if (json.pipeline) {
      data +=
        "\n" +
        (typeof json.pipeline === "string"
          ? `pipeline: "${json.pipeline}"`
          : `pipeline:\n${newLines(
              json.pipeline.map(e => `"${e}"`),
              "  - name: "
            )}`);
    } else {
      data += `\npipeline:
  - name: "tokenizer_whitespace"
  - name: "ner_crf"
  - name: "ner_synonyms"
  - name: "ner_duckling_http"
    url: "${process.env.RASA_DUCKLING_ENDPOINT}"
    locale: "en_GB"
    timezone: "Europe/Paris"
  - name: "intent_featurizer_count_vectors"
  - name: "intent_classifier_tensorflow_embedding"`;
    }
    data += "\n";

    // data
    data += "\ndata: ";
    if (json.data) {
      data += JSON.stringify(json.data, null, 2);
    } else subscriber.error(keyMissingError("data"));

    // file name
    if (json.project) {
      fname += normalize(json.project);
    } else subscriber.error(keyMissingError("project"));
    if (json.model) {
      fname += "-" + json.model;
    } else fname += "-" + formatDate(new Date());

    fname += ".json.yml";
    fname = "data/" + fname;
    fs.writeFileSync(fname, data);

    subscriber.next(fname);
  });
};

export const withRASATrainingData = (
  projectId: string,
  exampleProvided?: Example[]
): Observable<RASATrainingData> => {
  let intentsCol = new Collection(INTENT_COLLECTION);
  let intents$ = intentsCol.run<any[]>(c =>
    c.find({ appId: projectId }).toArray()
  );

  let examples$ = exampleProvided
    ? of(exampleProvided)
    : intents$.pipe(
        flatMap(intents =>
          examplesCol.run<any[]>(c =>
            c.find({ intentId: { $in: intents.map(i => i._id) } }).toArray()
          )
        )
      );

  let examplesCol = new Collection(EXAMPLE_COLLECTION);
  let entitiesCol = new Collection(ENTITY_COLLECTION);

  let entities$ = entitiesCol
    .run(c => c.find({ appId: projectId }).toArray())
    .pipe(
      map<any[], EntityDefinition[]>(docs =>
        docs.map(doc => new EntityDefinition(doc))
      )
    );
  return examples$.pipe(
    flatMap(examples =>
      entities$.pipe(
        map(entities => ({
          rasa_nlu_data: {
            common_examples: examples.map(ex => ({
              text: ex.text,
              intent: ex.intentName,
              entities: ex.entities
            })),
            regex_features: [],
            entity_synonyms: entities.map(entityDef => ({
              value: entityDef.value,
              synonyms: entityDef.synonyms
            }))
          }
        }))
      )
    )
  );
};
