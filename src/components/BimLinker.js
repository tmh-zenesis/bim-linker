import React, { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// Set the worker path to the public folder where pdf.worker.min.js is located
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const BimLinker = () => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dotPosition, setDotPosition] = useState(null);  // To store the current dot position
  const canvasRef = useRef(null);

  // Function to load the PDF file
  const loadPdf = async (pdfUrl) => {
    try {
      const loadedPdf = await getDocument(pdfUrl).promise;
      setPdf(loadedPdf);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  // Function to render the current page of the PDF
  const renderPage = async (pageNum) => {
    if (!pdf) return;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set the canvas dimensions to match the PDF page
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Clear the canvas before rendering the page
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Render the page onto the canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Draw the dot if there's a position
    if (dotPosition) {
      drawDot(dotPosition);
    }
  };

  // Function to handle click on the canvas and log the position
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // Get the canvas's position relative to the viewport
    const x = event.clientX - rect.left;  // X coordinate relative to the canvas
    const y = event.clientY - rect.top;   // Y coordinate relative to the canvas

    // Store the new position of the dot
    setDotPosition({ x, y });
  };

  // Draw the red dot at the specified coordinates
  const drawDot = (position) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const { x, y } = position;

    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI); // Draw a circle with radius 5
    context.fillStyle = 'red'; // Set the dot color to red
    context.fill();
  };

  useEffect(() => {
    loadPdf('/Grundriss Kellergeschoss_3.pdf');  // Path relative to the public folder
  }, []); // Only run once on component mount

  useEffect(() => {
    renderPage(currentPage);
  }, [pdf, currentPage, dotPosition]);  // Re-render when the page or dot position changes

  const nextPage = () => setCurrentPage(currentPage + 1);
  const prevPage = () => setCurrentPage(currentPage - 1);

  return (
    <div style={{ display: 'flex', margin: '20px' }}>
      {/* Left div for BimLinker */}
      <div style={{ flex: 1, padding: '20px' }}>
        <h1>BimLinker - PDF Viewer</h1>
        <canvas 
          ref={canvasRef} 
          onClick={handleCanvasClick} // Attach the click event
        ></canvas>
        <div>
          <button onClick={prevPage} disabled={currentPage <= 1}>Previous</button>
          <button onClick={nextPage} disabled={currentPage >= pdf?.numPages}>Next</button>
        </div>
        <p>Page {currentPage} of {pdf?.numPages}</p>
      </div>

      {/* Right div for future components */}
      <div style={{ flex: 1, padding: '20px', borderLeft: '1px solid #ddd' }}>
        <h2>Future Component</h2>
        <p>This space is reserved for a future component.</p>
      </div>
    </div>
  );
};

export default BimLinker;
