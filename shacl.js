import SHACLValidator from "rdf-validate-shacl";
import rdf from "@zazuko/env-node";
import { Readable } from "stream";
import Parser from "@rdfjs/parser-n3";
import jsonld from "jsonld";
import fs1 from "fs";
const fs = fs1.promises;

// Validate Physical Resource

const ENTITY = "mpc-laas"; //iaas, mpc, lp, sample

async function validate() {
  const shaclFilePath = "./shacl/" + ENTITY + "/shacl.ttl";
  const jsonFilePath = "./shacl/" + ENTITY + "/iaas.json";

  const shapesDataset = await readFileAsync(shaclFilePath);
  const selfDescriptionDataset = await readFileAsync(jsonFilePath);
  const shapes = await loadFromTurtle(shapesDataset);

  const parsedSD = JSON.parse(selfDescriptionDataset);

  const data = await loadFromJSONLDWithQuads(parsedSD);

  const validator = new SHACLValidator(shapes, { factory: rdf });

  const report = await validator.validate(data);

  const { conforms, results: reportResults } = report;

  const results = [];

  for (const result of reportResults) {
    const {
      message,
      path: { value },
    } = result;
    // console.log(
    //   "<------------------------------------------------------------------------------------------------>"
    // );

    // console.log(JSON.stringify(result.message));
    // console.log(JSON.stringify(result.path));
    // console.log(JSON.stringify(result.focusNode));
    // console.log(JSON.stringify(result.severity));
    // console.log(JSON.stringify(result.sourceConstraintComponent));
    // console.log(JSON.stringify(result.sourceShape));
    // console.log(
    //   "<------------------------------------------------------------------------------------------------>"
    // );
    const msg = JSON.stringify(message);
    results.push({ msg, path: value });
  }

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
