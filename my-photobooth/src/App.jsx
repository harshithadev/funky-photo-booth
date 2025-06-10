// src/App.jsx
import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import CropModal from './CropModal';
import './styles.css';

// available themes
const THEMES = ['Classic', 'Minimal', 'Retro'];

export default function App() {
  // === CONFIG STATE ===
  const [configDone, setConfigDone] = useState(false);
  const [config, setConfig] = useState({
    count: 4,
    mode: 'upload',     // 'upload' or 'camera'
    theme: 'Minimal',   // one of THEMES
  });

  // === PHOTO STATE ===
  const [originals, setOriginals] = useState([]);
  const [images, setImages]     = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError]       = useState('');

  // webcam ref
  const webcamRef = useRef(null);

  // center-crop helper (unchanged)
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

  // === STEP 1: CONFIGURE ===
  const handleConfigSubmit = () => {
    setError('');
    // flush any old photos
    setOriginals([]);
    setImages([]);
    setEditingIndex(null);
    setConfigDone(true);
  };

  // === STEP 2: UPLOAD HANDLER ===
  const handleFiles = async (e) => {
    const MAX = config.count;
    const files = Array.from(e.target.files).slice(0, MAX);
    if (e.target.files.length > MAX) {
      setError(`Only the first ${MAX} photos will be used.`);
    } else {
      setError('');
    }

    // read originals
    const dataUrls = await Promise.all(
      files.map(f => new Promise(r => {
        const rdr = new FileReader();
        rdr.onload = () => r(rdr.result);
        rdr.readAsDataURL(f);
      }))
    );
    setOriginals(dataUrls);

    // auto-crop
    const squares = await Promise.all(
      dataUrls.map(url => cropToSquare(url, 400))
    );
    setImages(squares);
  };

  // === STEP 2b: CAMERA CAPTURE ===
  const capturePhoto = async () => {
    const MAX = config.count;
    if (images.length >= MAX) {
      setError(`Max ${MAX} photos reached.`);
      return;
    }
    setError('');
    const shot = webcamRef.current.getScreenshot();
    if (!shot) return;
    setOriginals(orig => [...orig, shot]);
    const square = await cropToSquare(shot, 400);
    setImages(imgs => [...imgs, square]);
  };

  // === STEP 3: MANUAL CROP ===
  const applyCropped = (url) => {
    setImages(imgs => imgs.map((src,i) => i === editingIndex ? url : src));
    setEditingIndex(null);
  };

  // === STEP 4: GENERATE PNG ===
  const generatePNG = async () => {
    if (!images.length) {
      setError('Select at least one photo.');
      return;
    }
    setError('');

    const size = 400, border = 1, padding = 20, gap = 10;
    const width  = size + border*2 + padding*2;
    const height = padding*2 + images.length*(size+border*2) + (images.length-1)*gap;

    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < images.length; i++) {
      const imgEl = new Image();
      await new Promise(r => { imgEl.onload = r; imgEl.src = images[i]; });
      const x = padding + border;
      const y = padding + i*((size+border*2)+gap) + border;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = border;
      ctx.strokeRect(x-border, y-border, size+border*2, size+border*2);
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
      {/* LEFT PANEL: CONFIG or CONTROLS */}
      <div className="left-panel">
        {!configDone ? (
          <>
            <h2>Configure Your Strip</h2>

            <label>
              Number of photos (1–4):
              <input
                type="number"
                min={1}
                max={4}
                value={config.count}
                onChange={e =>
                  setConfig({...config, count: Number(e.target.value)})
                }
              />
            </label>

            <label>
              Mode:
              <select
                value={config.mode}
                onChange={e =>
                  setConfig({...config, mode: e.target.value})
                }
              >
                <option value="upload">Upload</option>
                <option value="camera">Camera</option>
              </select>
            </label>

            <label>
              Theme:
              <select
                value={config.theme}
                onChange={e =>
                  setConfig({...config, theme: e.target.value})
                }
              >
                {THEMES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <button onClick={handleConfigSubmit}>Proceed</button>
          </>
        ) : (
          <>
            <h2>📸 {config.theme} Mode</h2>

            {/* Toggle between camera/upload */}
            <div className="controls">
              {config.mode === 'camera' ? (
                <div className="camera">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user' }}
                  />
                  <button
                    onClick={capturePhoto}
                    disabled={images.length >= config.count}
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
                  disabled={images.length >= config.count}
                />
              )}

              <span>
                {images.length} / {config.count}
              </span>

              <button
                onClick={generatePNG}
                disabled={!images.length}
              >
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
          </>
        )}
      </div>

      {/* RIGHT PANEL: Preview + Crop */}
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
