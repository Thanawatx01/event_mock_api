"use strict";

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "generate-db.js");
let source = fs.readFileSync(filePath, "utf8");

source = source.replace(/^\s*help_text: .*,\r?\n/gm, "");
source = source.replace(
  /help_text: tr\.help_text \?\? null,\r?\n\s*/g,
  ""
);

fs.writeFileSync(filePath, source);
console.log("stripped help_text from generate-db.js");
