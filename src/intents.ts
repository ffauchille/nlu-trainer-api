import * as restify from "restify";
import { withJSON } from "./routes";
import { INTENT_COLLECTION, withId, runCmd, MONGO_ID_RGXP } from "./mongo";

export default (server: restify.Server) => {
    server.post("/intents", (request: restify.Request, response: restify.Response) => {
        withJSON(request, response, json => {
            runCmd(response, INTENT_COLLECTION, c => c.insertOne(withId(json)))
        })
    })

    server.get("/intents", (request: restify.Request, response: restify.Response) => {
        var selector = {}
        if (request.query) {
            let appId: string = request.query.appId
            if (appId) {
                if (appId.match(MONGO_ID_RGXP)) {
                    selector = { appId }
                }
            }
        }
        runCmd(response, INTENT_COLLECTION, c => c.find(selector).toArray())
    })
}