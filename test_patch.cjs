const fs = require('fs');
const content = fs.readFileSync('src/pages/EditBudgetPage.tsx', 'utf8');

console.log("useState ownership removed?", !content.includes("useState('joint')"));
console.log("setOwnership removed?", !content.includes("setOwnership("));
console.log("ownership update removed?", !content.includes("ownership\n        }"));
console.log("Location label present?", content.includes(">Location</label>"));
console.log("Ownership label present?", content.includes(">Ownership</label>"));
console.log("Groceries / Incidentals option present?", content.includes("Groceries / Incidentals"));
