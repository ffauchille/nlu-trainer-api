import * as restify from 'restify'
import * as corsMiddleware from 'restify-cors-middleware'
import rasaRoutes from './rasa'
import routes from './routes';


const server = restify.createServer()

const allowHeaders = (process.env.HTTP_ALLOW_HEADERS || "GET, OPTIONS, POST").split(/,\s*/)
const allowOrigins = (process.env.HTTP_ALLOW_ORIGINS || "*").split(/,\s*/)
const exposeHeaders = (process.env.HTTP_EXPOSED_HEADERS || "GET, OPTIONS, POST").split(/,\s*/)

const cors = corsMiddleware({
    allowHeaders,
    origins: allowOrigins,
    exposeHeaders
})

// Body & query parser plugins
server.use(restify.plugins.jsonBodyParser())
server.use(restify.plugins.queryParser())
// CORS
server.pre(cors.preflight)
server.use(cors.actual)

// Register app's routes
routes(server)


server.listen(process.env.HTTP_PORT || 8000, () => console.log(`Listening on ${server.url}`))