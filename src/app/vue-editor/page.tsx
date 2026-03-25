import Link from 'next/link';

export default function VueEditorPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Vue Fabric Editor</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Standalone Editor</h2>
          <p className="text-gray-600 mb-4">
            The Vue Fabric Editor has been extracted to a standalone folder. 
            To run the editor:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
            <li>Open a terminal in the <code className="bg-gray-100 px-2 py-1 rounded">temp-editor</code> folder</li>
            <li>Run <code className="bg-gray-100 px-2 py-1 rounded">npm install</code> to install dependencies</li>
            <li>Run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> to start the editor on port 3001</li>
            <li>Open <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://localhost:3001</a> in your browser</li>
          </ol>
          
          <div className="flex gap-4">
            <a 
              href="http://localhost:3001" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Editor (when running)
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Embedded Preview</h2>
          <p className="text-gray-600 mb-4">
            If the editor is running on port 3001, it will be embedded below:
          </p>
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden" style={{ height: '700px' }}>
            <iframe 
              src="http://localhost:3001" 
              className="w-full h-full"
              title="Vue Fabric Editor"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
