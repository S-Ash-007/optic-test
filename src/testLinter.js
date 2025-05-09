import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { join } from "path";
import Parsers from "@stoplight/spectral-parsers";
import spectralCore from "@stoplight/spectral-core";
const { Spectral, Document } = spectralCore;
import { myRuleset } from "./.spectral.js"; // Adjust the path as needed

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const myDocument = new Document(
  fs.readFileSync(join(__dirname, "openapi.yaml"), "utf-8").trim(),
  Parsers.Yaml,
  "openapi.yaml"
);

const spectral = new Spectral();
spectral.setRuleset(myRuleset); // Apply JS ruleset directly

spectral.run(myDocument).then(console.log);
