const fs = require("fs");
const path = require("path");
const jsonServer = require("json-server");

const server = jsonServer.create();
const dbPath = path.join(process.cwd(), "db.json");
const middlewares = jsonServer.defaults({
  noCors: false,
});

/**
 * Vercel / Lambda filesystems are read-only — FileSync writes throw EROFS.
 * Load db.json into memory so POST/PUT/PATCH/DELETE work for the instance lifetime.
 */
const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);
const seed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const router = jsonServer.router(isServerless ? seed : dbPath);

server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
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
