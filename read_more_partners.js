const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'LISTE DES COMPTES CLIENTS COMPTANTS.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, {header: 1});

console.log('Sample rows:');
data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
});
