import React, { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// Set the worker path to the public folder where pdf.worker.min.js is located
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const BimLinker = () => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dotPosition, setDotPosition] = useState(null);  // To store the current dot position
  const [pdfName, setPdfName] = useState(""); // To store the name of the document
  const canvasRef = useRef(null); // Ref for the canvas
  const imageRef = useRef(null);  // Ref for the image element to display the final image

  // Function to load the PDF file
  const loadPdf = async (pdfUrl) => {
    try {
      const loadedPdf = await getDocument(pdfUrl).promise;
      setPdf(loadedPdf);

      // Extract the document name from the URL and set it
      const name = pdfUrl.split('/').pop(); // Get the last part of the URL
      setPdfName(name); // Set the PDF file name
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  // Function to render the current page of the PDF with or without a dot
  const renderPage = async (pageNum, canvas, dotPosition = null) => {
    if (!pdf || !canvas) return;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
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

    // If a dot position is available, draw it
    if (dotPosition) {
      drawDot(context, dotPosition);
    }

    // Convert the canvas with the dot into an image and display it immediately
    convertCanvasToImage(canvas);
  };

  // Function to handle click on the canvas and log the position
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // Get the canvas's position relative to the viewport
    const x = event.clientX - rect.left;  // X coordinate relative to the canvas
    const y = event.clientY - rect.top;   // Y coordinate relative to the canvas

    // Store the new position of the dot
    setDotPosition({ x, y });

    // Render the page with the red dot immediately
    renderPage(currentPage, canvasRef.current, { x, y });
  };

 // Draw the blue dot at the specified coordinates
    const drawDot = (context, position) => {
    const { x, y } = position;
    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI); // Draw a circle with radius 5
    context.fillStyle = 'blue'; // Set the dot color to blue
    context.fill();
  };
  

  // Function to convert the canvas to an image and display it
  const convertCanvasToImage = (canvas) => {
    if (canvas && imageRef.current) {
      // Create an image from the canvas content
      const dataUrl = canvas.toDataURL();
      imageRef.current.src = dataUrl;  // Set the image source to the canvas data URL
    }
  };

  useEffect(() => {
    loadPdf('/Grundriss Kellergeschoss_3.pdf');  // Path relative to the public folder
  }, []); // Only run once on component mount

  useEffect(() => {
    if (canvasRef.current) {
      renderPage(currentPage, canvasRef.current); // Render the page initially without the dot
    }
  }, [pdf, currentPage]); // Re-render when the page changes

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

      {/* Right div for the image generated from the canvas */}
      <div style={{ flex: 1, padding: '20px', borderLeft: '1px solid #ddd' }}>
        <h2>{pdfName}</h2> {/* Display the PDF name above the image */}
        <img ref={imageRef} alt="PDF with Blue Dot" style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  );
};

export default BimLinker;
