import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { DataImportService } from '../services/DataImportService';

const TABLE_SCHEMAS: Record<string, string[]> = {
    accounts: ['id', 'name', 'balance', 'interestRate', 'category', 'ownerId', 'notes'],
    budgets: ['id', 'importCategory', 'name', 'amount', 'frequency', 'paymentSource', 'ownership', 'importMappingName'],
    transactions: ['id', 'date', 'payee', 'amount', 'importCategory', 'type', 'icon', 'rawDesc']
};

export function ImportProcessor() {
    const { table } = useParams<{ table: string }>();
    const navigate = useNavigate();

    const targetTable = table as 'accounts' | 'budgets' | 'transactions';
    const isValidTable = targetTable && Object.keys(TABLE_SCHEMAS).includes(targetTable);

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isValidTable) {
        return (
            <AppLayout header={<Header title="Invalid Table" leftElement={<Icon name="arrow_back" onClick={() => navigate(-1)} />} />}>
                <div className="p-4 text-red-500">Invalid table selected for import.</div>
            </AppLayout>
        );
    }

    const targetFields = TABLE_SCHEMAS[targetTable];

    const handleFileSelect = async () => {
        try {
            setError(null);
            // Feature detect the File System Access API
            if ('showOpenFilePicker' in window) {
                const [fileHandle] = await (window as any).showOpenFilePicker({
                    types: [
                        {
                            description: 'CSV or JSON Files',
                            accept: {
                                'text/csv': ['.csv'],
                                'application/json': ['.json'],
                            },
                        },
                    ],
                    multiple: false
                });
                const selectedFile = await fileHandle.getFile();
                await processFile(selectedFile);
            } else {
                // Fallback for browsers that don't support showOpenFilePicker (like iOS Safari)
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.json';
                input.onchange = async (e: any) => {
                    const selectedFile = e.target.files[0];
                    if (selectedFile) await processFile(selectedFile);
                };
                input.click();
            }
        } catch (err: any) {
            // User cancelled or error occurred
            if (err.name !== 'AbortError') {
                setError(err.message || 'Failed to open file picker.');
            }
        }
    };

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        try {
            const data = await DataImportService.parseFile(selectedFile);
            setParsedData(data);
            if (data.length > 0) {
                const sourceHeaders = Object.keys(data[0]);
                setHeaders(sourceHeaders);

                // Auto-map where possible (case-insensitive)
                const initialMapping: Record<string, string> = {};
                sourceHeaders.forEach(header => {
                    const matchedTarget = targetFields.find(f => f.toLowerCase() === header.toLowerCase());
                    if (matchedTarget) {
                        initialMapping[header] = matchedTarget;
                    }
                });
                setMapping(initialMapping);
            }
        } catch (err: any) {
            setError(err.message || 'Error parsing file.');
        }
    };

    const handleMappingChange = (sourceField: string, targetField: string) => {
        setMapping(prev => ({
            ...prev,
            [sourceField]: targetField
        }));
    };

    const handleImport = async () => {
        if (!file || parsedData.length === 0) return;
        setIsImporting(true);
        setError(null);
        try {
            await DataImportService.importData(targetTable, parsedData, file.name, mapping);
            navigate(-1); // Go back on success
        } catch (err: any) {
            setError(err.message || 'An error occurred during import.');
            setIsImporting(false);
        }
    };

    return (
        <AppLayout
            header={
                <Header
                    title={`Import ${targetTable.charAt(0).toUpperCase() + targetTable.slice(1)}`}
                    leftElement={<Icon name="arrow_back" className="text-primary text-2xl cursor-pointer" onClick={() => navigate(-1)} />}
                    className="bg-transparent backdrop-blur-md"
                />
            }
        >
            <div className="flex-1 w-full mx-auto p-4 space-y-6">
                {!file ? (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        <Icon name="upload_file" className="text-6xl text-slate-400 mb-4" />
                        <p className="text-slate-600 dark:text-slate-300 mb-4 text-center">Select a CSV or JSON file to import</p>
                        <button
                            onClick={handleFileSelect}
                            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Select File
                        </button>
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-primary/5">
                            <h3 className="font-semibold mb-2">File Info</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Name: {file.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Rows: {parsedData.length}</p>
                        </div>

                        {parsedData.length > 0 && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Column Mapping</h3>
                                    <p className="text-xs text-slate-500 mb-4">Map your file columns to the database fields.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {headers.map(header => (
                                            <div key={header} className="flex items-center space-x-2">
                                                <div className="flex-1 text-sm font-medium truncate" title={header}>{header}</div>
                                                <Icon name="arrow_forward" className="text-slate-400" />
                                                <select
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm"
                                                    value={mapping[header] || ''}
                                                    onChange={(e) => handleMappingChange(header, e.target.value)}
                                                >
                                                    <option value="">-- Ignore --</option>
                                                    {targetFields.map(field => (
                                                        <option key={field} value={field}>{field}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Pre-Import Preview (First 5 rows)</h3>
                                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    {headers.map((header, idx) => (
                                                        <th key={idx} className="p-2 font-medium">
                                                            <div>{header}</div>
                                                            <div className="text-xs text-primary font-normal">{mapping[header] || 'Ignored'}</div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.slice(0, 5).map((row, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50">
                                                        {headers.map((header, hIdx) => (
                                                            <td key={hIdx} className="p-2 truncate max-w-[150px]">{String(row[header] || '')}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {error && <p className="text-red-500">{error}</p>}

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => { setFile(null); setParsedData([]); }}
                                        className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-4 py-3 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                        disabled={isImporting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={isImporting}
                                        className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {isImporting ? 'Importing...' : 'Confirm Import'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}