import React, { useState, useRef } from 'react';
import AskPdf from '../components/AskPdf';
import { FiUpload, FiSend, FiFileText, FiCpu, FiMaximize, FiMinimize } from 'react-icons/fi';

const BYT = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const BACKEND_URL = 'http://localhost:8003'; // Updated backend port

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);

      // Create object URL for PDF preview
      if (uploadedFile.type === 'application/pdf') {
        const url = URL.createObjectURL(uploadedFile);
        setPdfUrl(url);
      }

      try {
        const text = await uploadedFile.text();
        setFileContent(text);
        // Add welcome message
        setMessages([
          {
            type: 'system',
            content: `Welcome! I've loaded "${uploadedFile.name}". Ask me any scientific questions about the content.`
          }
        ]);
      } catch (error) {
        console.error('Error reading file:', error);
        setMessages([
          {
            type: 'system',
            content: 'Error reading the file. Please try again with a different file.'
          }
        ]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !fileContent) return;

    // Add user message
    const newMessages = [
      ...messages,
      { type: 'user', content: query }
    ];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/byt-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fileContent,
          query: query,
          analysis_type: 'research'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMessages([
          ...newMessages,
          { type: 'assistant', content: data.analysis }
        ]);
      } else {
        throw new Error(data.analysis || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        {
          type: 'system',
          content: `Error: ${error.message || 'Failed to connect to the analysis server. Please make sure the backend is running.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll chat to bottom
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-800">
        <FiCpu className="text-cyan-400 text-3xl mr-3" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          BYT (Bring Your Text) Analyzer
        </h1>
      </div>

      <AskPdf />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - PDF Viewer */}
        <div className={`${pdfUrl ? 'w-1/2' : 'w-1/3'} border-r border-gray-800 p-4 flex flex-col`}>
          {!pdfUrl ? (
            // Upload Section
            <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-xl p-6 border border-cyan-800">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-full p-4 border-2 border-dashed border-cyan-600 rounded-lg hover:border-cyan-400 transition-colors"
              >
                <FiUpload className="text-cyan-400 text-xl mr-2" />
                <span>Upload PDF Document</span>
              </button>
            </div>
          ) : (
            // PDF Viewer
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <FiFileText className="text-cyan-400 text-xl mr-2" />
                  <span className="text-sm text-cyan-300">{file?.name}</span>
                </div>
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {isFullScreen ? <FiMinimize /> : <FiMaximize />}
                </button>
              </div>
              <iframe
                src={pdfUrl}
                className={`flex-1 w-full bg-white rounded-lg ${
                  isFullScreen ? 'fixed inset-0 z-50' : ''
                }`}
                style={{ minHeight: '500px' }}
              />
            </div>
          )}
        </div>

        {/* Right Side - Chat Interface */}
        <div className={`${pdfUrl ? 'w-1/2' : 'w-2/3'} flex flex-col p-4`}>
          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-gray-800"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3/4 p-4 rounded-lg ${message.type === 'user' ? 'bg-cyan-900 text-white' : message.type === 'system' ? 'bg-gray-700 text-cyan-300' : 'bg-blue-900 text-white'}`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-cyan-300 p-4 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-4 p-4 border-t border-gray-800">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a scientific question about your document..."
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={!fileContent}
            />
            <button
              type="submit"
              disabled={!fileContent || !query.trim() || loading}
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FiSend className="mr-2" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BYT;
