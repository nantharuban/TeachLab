const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '..', 'data_source.csv');
const unitRegistryPath = path.join(__dirname, '..', 'units', 'U01_nervous_system', 'unit.csv');

if (!fs.existsSync(registryPath)) {
  throw new Error('Missing data_source.csv unit registry');
}

if (!fs.existsSync(unitRegistryPath)) {
  throw new Error('Missing U01 unit.csv subunit registry');
}

const content = fs.readFileSync(registryPath, 'utf8');
if (!content.includes('unit_id,title,folder,display_order,enabled')) {
  throw new Error('Unit registry does not contain the required columns');
}

if (!content.includes('U01,Nervous System,U01_nervous_system,1,1')) {
  throw new Error('Unit registry does not include U01 Nervous System');
}

const unitContent = fs.readFileSync(unitRegistryPath, 'utf8');
if (!unitContent.includes('subunit_id,title,folder,display_order,enabled')) {
  throw new Error('Subunit registry does not contain the required columns');
}

if (!unitContent.includes('SU01') || !unitContent.includes('SU02')) {
  throw new Error('Subunit registry does not include SU01 and SU02');
}
