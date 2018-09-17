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
import { withRASATrainingData } from "./files";
import { map, take, flatMap } from "rxjs/operators";
import { evaluate } from "./rasa";
import { AppModel } from "./models";
import { of } from "rxjs";
import { appExamples$ } from "./entities";

export default (server: restify.Server) => {
  server.post(
    "/testsuites",
    (request: restify.Request, response: restify.Response) => {
      withJSON(request, response, json => {
        let newSuite = withId(json);
        let suite$ = of(newSuite);
        if (newSuite.appId && newSuite.appId.match(MONGO_ID_RGXP)) {
          if (newSuite.fromTraining) {
            suite$ = appExamples$(newSuite.appId).pipe(
              map(examples => ({
                ...newSuite,
                testExamples: [...newSuite.testExamples, examples]
              }))
            );
          }
          delete newSuite.fromTraining;
          suite$
            .pipe(
              map(suite => {
                let testSuite = {
                  ...suite,
                  testExamples: (suite.examples || []).map(ex => ({
                    text: ex.text,
                    intent: ex.intent,
                    entities: ex.entities || []
                  }))
                };
                return new Collection(TEST_SUITE_COLLECTION).run(c =>
                  c.insertOne(testSuite).then(_ => testSuite)
                );
              }),
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
              map(testSuite =>
                withRASATrainingData(testSuite.appId, testSuite.testExamples)
              ),
              flatMap(testees => {
                let apps = new Collection(APPS_COLLECTION);
                return apps
                  .run<AppModel>(c => c.findOne({ _id: testSuiteId }))
                  .pipe(map(app => evaluate(testees, app.name)));
              }),
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
