import SHACLValidator from "rdf-validate-shacl";
import rdf from "@zazuko/env-node";
import { Readable } from "stream";
import Parser from "@rdfjs/parser-n3";
import jsonld from "jsonld";
import fs1 from "fs";
import { Engine } from "sparql-engine";
const fs = fs1.promises;

// Validate Physical Resource

const ENTITY = "mpc-laas"; //mpc-laas, resource, lp, sample

async function validate() {
  const shaclFilePath = "./shacl/" + ENTITY + "/os.ttl";
  const jsonFilePath = "./shacl/" + ENTITY + "/os.json";

  const shapesDataset = await readFileAsync(shaclFilePath);
  const selfDescriptionDataset = await readFileAsync(jsonFilePath);
  const shapes = await loadFromTurtle(shapesDataset);

  const parsedSD = JSON.parse(selfDescriptionDataset);

  const data = await loadFromJSONLDWithQuads(parsedSD);

  // Step 2: SPARQL Constraint Validation
  const sparqlEngine = new Engine();

  const resultStream = await sparqlEngine.query(shapes, {
    sources: [data],
  });

  const results = [];
  resultStream.on("data", (row) => results.push(row));
  resultStream.on("end", () => {
    if (results.length === 0) {
      console.log("SPARQL constraints passed!");
    } else {
      console.error("SPARQL constraints failed! Invalid entries:", results);
    }
  });

  return {
    conforms,
    results,
  };
}

validate()
  .then((res) => {
    console.log(res);
  })
  .catch(console);

async function readFileAsync(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (err) {
    console.error("Error reading the file:", err);
  }
}

async function loadFromJSONLDWithQuads(data) {
  const quads = await jsonld.canonize(data, { format: "application/n-quads" });

  const parser = new Parser({ factory: rdf });
  if (!quads || quads.length === 0) {
    throw new ConflictException(
      "Unable to canonize your VerifiablePresentation"
    );
  }

  const stream = new Readable();
  stream.push(quads);
  stream.push(null);

  return await rdf.dataset().import(parser.import(stream));
}

async function loadFromTurtle(raw) {
  try {
    const parser = new Parser({ factory: rdf });
    return transformToStream(raw, parser);
  } catch (error) {
    throw new ConflictException("Cannot load from provided turtle.");
  }
}

async function transformToStream(raw, parser) {
  const stream = new Readable();
  stream.push(raw);
  stream.push(null);
  const result = await rdf.dataset().import(parser.import(stream));
  return result;
}
