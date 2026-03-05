const fs = require('fs');
const path = 'src/pages/EditBudgetPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove useState for ownership
content = content.replace(/const \[ownership, setOwnership\] = useState\('joint'\);\n\s*/g, '');

// 2. Remove setOwnership from useEffect
content = content.replace(/setOwnership\(budget\.ownership\);\n\s*/g, '');

// 3. Remove ownership from update call
content = content.replace(/ownership\s*\n\s*\}\);/g, '} );');
content = content.replace(/paymentSource,\n\s*\}/g, 'paymentSource\n        }'); // In case there was a comma

// 4. Update the "Payment Source" label and select options
content = content.replace(
  /<label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Payment Source<\/label>\s*<select[\s\S]*?<\/select>/,
  `<label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Location</label>
                            <select
                                value={paymentSource}
                                onChange={(e) => setPaymentSource(e.target.value)}
                                className="custom-select w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="Groceries / Incidentals">Groceries / Incidentals</option>
                                <option value="Monthly Bills">Monthly Bills</option>
                                <option value="Annual Bills">Annual Bills</option>
                            </select>`
);

// 5. Remove the "Ownership" section entirely
const ownershipSectionRegex = /<div className="flex flex-col gap-2">\s*<label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Ownership<\/label>[\s\S]*?<\/div>\s*<\/div>/;
content = content.replace(ownershipSectionRegex, '</div>');

// Remove extra grid-cols division that wraps Payment Source & Ownership, changing to just grid-cols-1 if we want, or remove grid-cols entirely for that row.
content = content.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\s*<div className="flex flex-col gap-2">\s*<label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Location<\/label>/,
`<div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Location</label>`);


fs.writeFileSync(path, content, 'utf8');
