import * as restify from "restify";

import { wrongFormatError } from "./error";
import {
  MONGO_ID_RGXP,
  quickCmd,
  TEST_SUITE_COLLECTION,
  withId,
  Collection,
  APPS_COLLECTION
} from "./mongo";
import { withJSON, withQP } from "./routes";
import { withRASATrainingData, parseCSV$ } from "./files";
import { map, take, flatMap } from "rxjs/operators";
import { evaluate$ } from "./rasa";
import {
  AppModel,
  TestSuite,
  RASATrainingData,
  Example,
  TestExample,
  mergeTestExamples
} from "./models";
import { of, Observable } from "rxjs";

const insertSuite$ = (
  suite: TestSuite
): Observable<any /* testSuite with id*/> => {
  let testSuite = withId({
    ...suite,
    testExamples: (suite.testExamples || []).map(ex => ({
      text: ex.text,
      intent: ex.intent,
      entities: ex.entities || []
    }))
  });
  return new Collection(TEST_SUITE_COLLECTION)
    .run(c => c.insertOne(testSuite).then(_ => testSuite))
    .pipe(map(_ => testSuite));
};

const suiteById$ = (suiteId: string) => {
  let selector = { _id: suiteId };
  let testsuites = new Collection(TEST_SUITE_COLLECTION);
  return testsuites.run<any>(c => c.findOne(selector));
};

/**
 * Update suite in database; e.g. name and test examples
 * @param suite the updated test suite
 * @return an observable containing same suite passed in param
 */
const updateSuite$ = (
  suite: TestSuite
): Observable<TestSuite /* updated */> => {
  let selector = { _id: suite._id };
  let testSuites = new Collection(TEST_SUITE_COLLECTION);
  return testSuites
    .run<any>(c =>
      c.updateOne(selector, {
        $set: { name: suite.name, testExamples: suite.testExamples }
      })
    )
    .pipe(map(_ => suite));
};

export default (server: restify.Server) => {
  server.post(
    "/testsuites",
    (request: restify.Request, response: restify.Response) => {
      withJSON(request, response, json => {
        let newSuite = withId(json);
        let suite$ = of(newSuite);
        if (newSuite.appId && newSuite.appId.match(MONGO_ID_RGXP)) {
          suite$
            .pipe(
              flatMap(suite => insertSuite$(suite)),
              take(1)
            )
            .subscribe(
              suiteInserted => response.send(201, suiteInserted),
              err =>
                response.send(500, {
                  err: "something went wrong inserting testsuite: " + err
                })
            );
        } else response.send(400, { err: "needs a valid appId in payload" });
      });
    }
  );

  server.get(
    "/testsuites",
    (request: restify.Request, response: restify.Response) => {
      var selector = {};
      withQP(request, response, ["appId"], appId => {
        if (appId.match(MONGO_ID_RGXP)) {
          selector = { appId };
          quickCmd(response, TEST_SUITE_COLLECTION, c =>
            c.find(selector).toArray()
          );
        } else wrongFormatError("app id has wrong format");
      });
    }
  );

  server.get(
    "/testsuites/evaluate",
    (request: restify.Request, response: restify.Response) => {
      var selector = {};
      withQP(request, response, ["testSuiteId"], testSuiteId => {
        if (testSuiteId.match(MONGO_ID_RGXP)) {
          selector = { _id: testSuiteId };
          let testsuites = new Collection(TEST_SUITE_COLLECTION);
          testsuites
            .run<any>(c => c.findOne(selector))
            .pipe(
              flatMap<TestSuite, RASATrainingData>(testSuite =>
                withRASATrainingData(
                  testSuite.appId,
                  testSuite.testExamples.map(
                    ex => new Example({ text: ex.text, intentName: ex.intent })
                  )
                ).pipe(
                  flatMap(testees => {
                    let apps = new Collection(APPS_COLLECTION);
                    return apps
                      .run<AppModel>(c => c.findOne({ _id: testSuite.appId }))
                      .pipe(flatMap(app => evaluate$(testees, app.name)));
                  })
                )
              ),
              take(1)
            )
            .subscribe(
              evaluationReport => response.send(200, evaluationReport),
              err =>
                response.send(500, {
                  err: "Something went wrong evaluating test suite: " + err
                })
            );
        } else wrongFormatError("app id has wrong format");
      });
    }
  );

  server.post(
    "/testsuites/examples/csv",
    restify.plugins.multipartBodyParser({
      mapParams: false,
      maxFileSize: 100000000 /* 95.4 MiB */
    }),
    (req: restify.Request, res: restify.Response, next: restify.Next) => {
      withQP(req, res, ["testSuiteId"], suiteId => {
        if (req && req.files && req.files.csvBytes && req.files.csvBytes) {
          suiteById$(suiteId)
            .pipe(
              flatMap(suite =>
                parseCSV$(req.files.csvBytes.path).pipe(
                  flatMap<TestExample[], TestSuite>(testees =>
                    updateSuite$({ ...suite, testExamples: mergeTestExamples(suite.testExamples, testees) })
                  )
                )
              ),
              take(1)
            )
            .subscribe(
              testSuite => res.send(200, testSuite),
              err => res.send(400, { error: err })
            );
        } else res.send(400, wrongFormatError("no CSV in payload"));
      });
    }
  );

  server.del(
    "/testsuites",
    (
      request: restify.Request,
      response: restify.Response,
      next: restify.Next
    ) => {
      withQP(request, response, ["testSuiteId"], testSuiteId =>
        quickCmd(response, TEST_SUITE_COLLECTION, c =>
          c.remove({ _id: testSuiteId })
        )
      );
    }
  );
};
