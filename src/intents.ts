import * as restify from "restify";
import { withJSON } from "./routes";
import { INTENT_COLLECTION, withId, runCmd } from "./mongo";

export default (server: restify.Server) => {
    server.post("/intents", (request: restify.Request, response: restify.Response) => {
        withJSON(request, response, json => {
            runCmd(response, INTENT_COLLECTION, c => c.insertOne(withId(json)))
        })
    })

    server.get("/intents", (_: restify.Request, response: restify.Response) => {
        runCmd(response, INTENT_COLLECTION, c => c.find({}).toArray())
    })
}