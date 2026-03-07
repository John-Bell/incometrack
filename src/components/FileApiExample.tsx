import { useState } from 'react';
import { Button } from './ui/Button';

export function FileApiExample() {
    const [status, setStatus] = useState<string>('');

    const handleSaveFile = async () => {
        if (!('showSaveFilePicker' in window)) {
            setStatus('File System Access API is not supported in this browser.');
            return;
        }

        try {
            // Options for the file picker
            const options = {
                suggestedName: 'example.txt',
                types: [
                    {
                        description: 'Text Files',
                        accept: {
                            'text/plain': ['.txt'],
                        },
                    },
                ],
            };

            // 1. Show save file picker (must be called directly in onClick for iOS)
            const fileHandle = await (window as any).showSaveFilePicker(options);

            // 2. Create writable stream
            const writable = await fileHandle.createWritable();

            // 3. Write data
            const data = 'Hello, iOS 26 File API!';
            await writable.write(data);

            // 4. Close the file
            await writable.close();

            setStatus('File saved successfully!');
        } catch (error: any) {
            console.error('Save failed:', error);
            if (error.name === 'AbortError') {
                setStatus('Save cancelled by user.');
            } else if (error.name === 'QuotaExceededError' || (error.message && error.message.toLowerCase().includes('quota'))) {
                 setStatus('Storage quota exceeded.');
            } else {
                setStatus(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Save File Example</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                This component demonstrates the File System WritableStream API for iOS 26.
            </p>
            <Button onClick={handleSaveFile} variant="primary">
                Save Test File
            </Button>
            {status && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{status}</p>}
        </div>
    );
}
