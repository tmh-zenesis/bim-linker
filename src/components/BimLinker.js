// src/components/BimLinker.js
import React, { useEffect, useRef, useState } from 'react';
// Correct import for pdfjs-dist components
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// Set the worker path to the public folder where pdf.worker.min.js is located
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const BimLinker = () => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const canvasRef = useRef(null);

  // Function to load the PDF file
  const loadPdf = async (pdfUrl) => {
    try {
      // Load the PDF from the provided URL (path relative to the public folder)
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

    // Render the page onto the canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
  };

  useEffect(() => {
    // Load the PDF file from the public folder when the component mounts
    loadPdf('/Grundriss Kellergeschoss_3.pdf');  // Path relative to the public folder
  }, []); // Only run once on component mount

  useEffect(() => {
    // Render the current page when the PDF is loaded or page changes
    renderPage(currentPage);
  }, [pdf, currentPage]);

  // Function to handle click on the canvas and log the position
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // Get the canvas's position relative to the viewport
    const x = event.clientX - rect.left;  // X coordinate relative to the canvas
    const y = event.clientY - rect.top;   // Y coordinate relative to the canvas

    console.log(`Click position: X: ${x}, Y: ${y}`);
  };

  // Add event listener for click on canvas element
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleCanvasClick);

      // Cleanup event listener when component unmounts
      return () => {
        canvas.removeEventListener('click', handleCanvasClick);
      };
    }
  }, []);

  const nextPage = () => setCurrentPage(currentPage + 1);
  const prevPage = () => setCurrentPage(currentPage - 1);

  return (
    <div>
      <h1>BimLinker - PDF Viewer</h1>
      <canvas ref={canvasRef}></canvas>
      <div>
        <button onClick={prevPage} disabled={currentPage <= 1}>Previous</button>
        <button onClick={nextPage} disabled={currentPage >= pdf?.numPages}>Next</button>
      </div>
      <p>Page {currentPage} of {pdf?.numPages}</p>
    </div>
  );
};

export default BimLinker;
