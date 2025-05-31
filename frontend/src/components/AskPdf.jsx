import React, { useState } from 'react';

const AskPdf = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  const handleFileChange = (event) => {
    setPdfFile(event.target.files[0]);
  };

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSubmit = async () => {
    if (!pdfFile || !query) {
      alert('Please upload a PDF and enter a query.');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('query', query);

    try {
      const response = await fetch('http://localhost:8000/api/askpdf', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data.response);
      } else {
        console.error('Error:', response.statusText);
        setResponse('Error processing the request.');
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error processing the request.');
    }
  };

  return (
    <div>
      <h2>Ask PDF</h2>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <input
        type="text"
        placeholder="Enter your query"
        value={query}
        onChange={handleQueryChange}
      />
      <button onClick={handleSubmit}>Submit</button>
      <div>
        <h3>Response:</h3>
        <p>{response}</p>
      </div>
    </div>
  );
};

export default AskPdf;
