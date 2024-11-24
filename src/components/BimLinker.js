import React, { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import '@google/model-viewer';
import './BimLinker.css'; // Import external CSS for styling

// Set the worker path to the public folder where pdf.worker.min.js is located
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const BimLinker = () => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dotPosition, setDotPosition] = useState(null); // To store the current dot position
  const [pdfName, setPdfName] = useState(""); // To store the name of the document
  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0, z: 0 }); // For 3D model position
  const [modelPath, setModelPath] = useState("/Grundriss Kellergeschoss_3.glb"); // Set the path for your 3D model
  const [cameraControlsEnabled, setCameraControlsEnabled] = useState(false); // Initially disabled
  const canvasRef = useRef(null); // Ref for the canvas

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
  };

  // Function to handle click on the canvas and log the position
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // Get the canvas's position relative to the viewport
    const x = event.clientX - rect.left; // X coordinate relative to the canvas
    const y = event.clientY - rect.top; // Y coordinate relative to the canvas

    // Store the new position of the dot
    const dot = { x, y };
    setDotPosition(dot);

    // Render the page with the blue dot immediately
    renderPage(currentPage, canvas, dot);

    // Map 2D dot position to 3D model coordinates
    const modelCoord = mapTo3D(x, y, canvas.width, canvas.height);
    setModelPosition(modelCoord);

    // Update the camera position dynamically
    const modelViewer = document.querySelector('model-viewer');
    if (modelViewer) {
      modelViewer.cameraTarget = `${modelCoord.x} ${modelCoord.y} ${modelCoord.z}`;
      modelViewer.cameraOrbit = '0deg 75deg 2m'; // Adjust orbit to focus on the point
      modelViewer.updateFraming();
    }
  };

  // Draw the blue dot at the specified coordinates
  const drawDot = (context, position) => {
    const { x, y } = position;
    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI); // Draw a circle with radius 5
    context.fillStyle = 'blue'; // Set the dot color to blue
    context.fill();
  };

  // Map 2D canvas coordinates to 3D GLB model coordinates
  const mapTo3D = (x, y, canvasWidth, canvasHeight) => {
    const pdfWidth = 100; // Width of the actual content in the PDF in real-world units (e.g., meters)
    const pdfHeight = 100; // Height of the actual content in the PDF in real-world units

    const modelWidth = 10; // Width of the GLB model in the 3D space
    const modelHeight = 10; // Height of the GLB model in the 3D space

    // Normalize the 2D PDF coordinates to 3D space
    const normalizedX = (x / canvasWidth) * pdfWidth - pdfWidth / 2; // Center the origin
    const normalizedY = -(y / canvasHeight) * pdfHeight + pdfHeight / 2; // Invert Y and center

    // Map the PDF coordinates to GLB model space
    const modelX = (normalizedX / pdfWidth) * modelWidth;
    const modelY = (normalizedY / pdfHeight) * modelHeight;
    const modelZ = 0; // Assume a flat Z plane for simplicity

    return { x: modelX, y: modelY, z: modelZ };
  };

  // Toggle camera controls on and off
  const toggleCameraControls = (event) => {
    setCameraControlsEnabled(event.target.checked); // Update the state based on switch value
  };

  useEffect(() => {
    loadPdf('/Grundriss Kellergeschoss_3.pdf'); // Path relative to the public folder
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
      </div>

      {/* Right div for 3D model viewer */}
      <div style={{ flex: 1, padding: '20px', borderLeft: '1px solid #ddd' }}>
        <h2>3D Model Viewer</h2>

        {/* Modern Switcher to toggle camera controls */}
        <label className="switch">
          <i className={`fas fa-camera ${cameraControlsEnabled ? 'active' : ''}`} style={{ marginRight: '10px' }}></i> {/* Camera icon to the left of the switch */}
          <input
            type="checkbox"
            checked={cameraControlsEnabled}
            onChange={toggleCameraControls}
            className="hidden-checkbox" // Add a class to target the checkbox
          />
          <span className="slider"></span>
        </label>
        <model-viewer
          src={modelPath}
          alt="A 3D model of the example object"
          camera-controls={cameraControlsEnabled ? '' : undefined} // Toggle the camera-controls attribute
          ar
          style={{ width: '100%', height: '100%' }}
          camera-target={`${modelPosition.x} ${modelPosition.y} ${modelPosition.z}`} // Focus on the mapped position
          camera-orbit="0deg 0deg 2m" // Set camera orbit to top-down view (0 degrees azimuth, 90 degrees polar)
        >
          <button
            slot="hotspot-1"
            data-position={`${modelPosition.x} ${modelPosition.y} ${modelPosition.z}`}
            data-normal="0 0 1"
            style={{ background: 'red' }}
          >
            Selected Point
          </button>
        </model-viewer>
      </div>
    </div>
  );
};

export default BimLinker;
