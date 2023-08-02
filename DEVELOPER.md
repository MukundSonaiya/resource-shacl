# Questions

1. maintainedBy[], ownedBy[], manufacturedBy[] should be resolvable links or participant type nodes/json directly?
2. We are still looking for regex for GPS value in ISO 6709:2008/Cor 1:2009 format.
3. In PostalAddressShape we have changed the property name to "gx:countryCode" and added sh:maxCount to 1
4. Should there be only 1 shape called 'Resource' or we can have 3 different shapes for 'Physical', 'VirtualSoftware', 'VirtualData' resource.

# Setup

1. Use node version - v16.20.1
2. npm ci
3. node shacl.js

# Testing

- The setup uses the  'PhysicalResourceShape.ttl' & 'physical-resource.json' file for testing.
- You can remove any of the mandatory fields defined in SHACL file from 'physical-resource.json' & run 'node shacl.js' to validate the json. 