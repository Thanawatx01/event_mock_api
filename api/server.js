const jsonServer = require("json-server");
const path = require("path");

const server = jsonServer.create();
const dbPath = path.join(process.cwd(), "db.json");
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults({
  noCors: false,
});

server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use(router);

module.exports = server;
