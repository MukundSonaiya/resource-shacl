import { Parser } from "sparqljs";
import { SparqlEngine } from "sparql-engine";
const jsonData = "./smartsense/virtual-data-resource.json";

// Your SPARQL query
const sparqlQuery = `
  PREFIX ex: <http://example.org/>
  ASK {
    ?s ex:containsPII true ;
      ex:legalBasis [] ;
      ex:dataProtectionContact [] .
  }
`;

// Parse the SPARQL query
const parser = new Parser();
const parsedQuery = parser.parse(sparqlQuery);
// Execute the SPARQL query on the JSON dataset
const engine = new SparqlEngine();
const results = engine.execute(parsedQuery, { data: jsonData });

// Display the query results
console.log(results);
