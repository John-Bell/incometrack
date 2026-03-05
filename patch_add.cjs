const fs = require('fs');
const path = 'src/pages/AddBudgetPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace "Payment Source" section with new "Location" select using same structure as "Category"
const paymentSourceRegex = /\{\/\* Payment Source \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
const locationHtml = `{/* Location */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Location</label>
                        <div className="relative">
                            <select defaultValue="" className="w-full appearance-none rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 pr-10 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                                <option disabled value="">Select a location</option>
                                <option value="Groceries / Incidentals">Groceries / Incidentals</option>
                                <option value="Monthly Bills">Monthly Bills</option>
                                <option value="Annual Bills">Annual Bills</option>
                            </select>
                            <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                    </div>`;
content = content.replace(paymentSourceRegex, locationHtml);

// Remove "Ownership" section entirely
const ownershipRegex = /\s*\{\/\* Ownership \*\/\}\s*<div className="space-y-3">[\s\S]*?<\/div>\s*<\/div>/;
content = content.replace(ownershipRegex, '');

fs.writeFileSync(path, content, 'utf8');
