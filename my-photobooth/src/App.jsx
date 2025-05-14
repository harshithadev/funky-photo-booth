// src/App.jsx
import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import CropModal from './CropModal';
import './styles.css';

// Helper: center-crop any Data-URL image into a size×size square
function cropToSquare(dataUrl, size = 400) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      const { width: w, height: h } = img;
      if (w > h) {
        const x0 = (w - h) / 2;
        ctx.drawImage(img, x0, 0, h, h, 0, 0, size, size);
      } else {
        const y0 = (h - w) / 2;
        ctx.drawImage(img, 0, y0, w, w, 0, 0, size, size);
      }
      res(canvas.toDataURL('image/jpeg'));
    };
    img.src = dataUrl;
  });
}

export default function App() {
  const MAX_IMAGES = 4;

  // State
  const [originals, setOriginals] = useState([]);         // Raw captures/uploads
  const [images, setImages]     = useState([]);            // Auto-cropped squares
  const [editingIndex, setEditingIndex] = useState(null);  // Which image to manually crop
  const [error, setError]       = useState('');            // Error banner text
  const [useCamera, setUseCamera] = useState(false);       // Toggle camera vs upload
  const webcamRef = useRef(null);

  // Handle file uploads
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > MAX_IMAGES) {
      setError(`Only first ${MAX_IMAGES} photos will be used.`);
    } else {
      setError('');
    }
    const selected = files.slice(0, MAX_IMAGES);

    const dataUrls = await Promise.all(
      selected.map(f =>
        new Promise(r => {
          const reader = new FileReader();
          reader.onload = () => r(reader.result);
          reader.readAsDataURL(f);
        })
      )
    );
    setOriginals(dataUrls);

    const squares = await Promise.all(
      dataUrls.map(url => cropToSquare(url, 400))
    );
    setImages(squares);
  };

  // Capture photo from webcam
  const capturePhoto = async () => {
    if (images.length >= MAX_IMAGES) {
      setError(`Max ${MAX_IMAGES} photos reached.`);
      return;
    }
    setError('');
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    setOriginals(orig => [...orig, screenshot]);
    const square = await cropToSquare(screenshot, 400);
    setImages(imgs => [...imgs, square]);
  };

  // Apply manual crop
  const applyCropped = (dataUrl) => {
    setImages(imgs =>
      imgs.map((src, i) => (i === editingIndex ? dataUrl : src))
    );
    setEditingIndex(null);
  };

  // Generate and download final PNG strip
  const generatePNG = async () => {
    if (!images.length) {
      setError('Please select at least one photo.');
      return;
    }
    setError('');

    const size = 400,
          border = 1,
          padding = 20,
          gap = 10;
    const width  = size + border * 2 + padding * 2;
    const height = padding * 2 + images.length * (size + border * 2) + (images.length - 1) * gap;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < images.length; i++) {
      const imgEl = new Image();
      await new Promise(r => {
        imgEl.onload = r;
        imgEl.src = images[i];
      });
      const x = padding + border;
      const y = padding + i * ((size + border * 2) + gap) + border;

      ctx.strokeStyle = '#000';
      ctx.lineWidth = border;
      ctx.strokeRect(
        x - border,
        y - border,
        size + border * 2,
        size + border * 2
      );
      ctx.drawImage(imgEl, x, y, size, size);
    }

    canvas.toBlob(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'photobooth-strip.png';
      link.click();
    }, 'image/png');
  };

  return (
    <div className="split-container">
      {/* Left Panel: Controls */}
      <div className="left-panel">
        <h1>📸 Photo Booth</h1>

        <div className="controls">
          <button
            className={useCamera ? 'active' : ''}
            onClick={() => setUseCamera(true)}
          >
            Camera
          </button>
          <button
            className={!useCamera ? 'active' : ''}
            onClick={() => setUseCamera(false)}
          >
            Upload
          </button>

          {useCamera ? (
            <div className="camera">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
              />
              <button
                onClick={capturePhoto}
                disabled={images.length >= MAX_IMAGES}
              >
                Capture
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              disabled={images.length >= MAX_IMAGES}
            />
          )}

          <span>{images.length} / {MAX_IMAGES}</span>
          <button onClick={generatePNG} disabled={!images.length}>
            Download PNG
          </button>
        </div>

        {error && (
          <div className="error-banner">
            {error}
            <button
              className="dismiss"
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Right Panel: Preview & Crop */}
      <div className="right-panel">
        <div className="preview">
          {images.map((src, i) => (
            <div key={i} className="thumb-wrapper">
              <img src={src} alt={`Preview ${i}`} />
              <button onClick={() => setEditingIndex(i)}>Crop</button>
            </div>
          ))}
        </div>

        {editingIndex !== null && (
          <CropModal
            src={originals[editingIndex]}
            onCancel={() => setEditingIndex(null)}
            onComplete={applyCropped}
          />
        )}
      </div>
    </div>
  );
}
