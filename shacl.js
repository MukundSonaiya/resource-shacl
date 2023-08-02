import SHACLValidator from "rdf-validate-shacl";
import rdf from "rdf-ext";
import { Readable } from "stream";
import Parser from "@rdfjs/parser-n3";
import jsonld from "jsonld";
import fs1 from "fs";
const fs = fs1.promises;

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

  return await rdf.dataset().import(parser.import(stream));
}

const filePath1 = "./smartsense/physical-resource/PhysicalResourceShape.ttl";
const filePath2 = "./smartsense/physical-resource/physical-resource.json";



async function validate() {
  const shapesDataset = await readFileAsync(filePath1);
  const selfDescriptionDataset = await readFileAsync(filePath2);
  const shapes = await loadFromTurtle(shapesDataset);
  
  const data = await loadFromJSONLDWithQuads(JSON.parse(selfDescriptionDataset));
  

  const validator = new SHACLValidator(shapes, { factory: rdf });
  const report = await validator.validate(data);
  const { conforms, results: reportResults } = report;

  const results = [];
  for (const result of reportResults) {
    let errorMessage = `ERROR: ${result.path}: ${
      result.message || "does not conform with the given shape"
    }`;

    if (result.detail && result.detail.length > 0) {
      errorMessage = `${errorMessage}; DETAILS:`;
      for (const detail of result.detail) {
        errorMessage = `${errorMessage} ${detail.path}: ${
          detail.message || "does not conform with the given shape"
        };`;
      }
    }
    results.push(errorMessage);
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
