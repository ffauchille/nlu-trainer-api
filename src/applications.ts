import * as restify from "restify";
import { withJSON } from "./routes";
import { APPS_COLLECTION, withId, runCmd } from "./mongo";
import { AppModel } from "./models";

export default (server: restify.Server) => {
  server.post(
    "/apps",
    (request: restify.Request, response: restify.Response) => {
      withJSON<AppModel>(request, response, json => {
        let withMeta: AppModel = { ...json, status: "empty" }
        runCmd(response, APPS_COLLECTION, c => c.insertOne(withId(withMeta)));
      });
    }
  );

  server.get("/apps", (_: restify.Request, response: restify.Response) => {
    runCmd(response, APPS_COLLECTION, c => c.find({}).toArray());
  });
};
