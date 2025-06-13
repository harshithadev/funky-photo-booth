// src/App.jsx
import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import CropModal from './CropModal';
import './styles.css';

const THEMES = ['Classic', 'Minimal', 'Retro'];
const MAX_PHOTOS = 4;

// A collapsible panel with smooth open/close
function Collapsible({ id, title, isOpen, onToggle, disabled, children }) {
  return (
    <div className={`collapsible ${disabled ? 'disabled' : ''}`}>
      <div className="collapsible-header" onClick={() => !disabled && onToggle(id)}>
        <span>{title}</span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▶</span>
      </div>
      <div className={`collapsible-body ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
}

// Center-crop helper (unchanged)
function cropToSquare(dataUrl, size = 400) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      const { width: w, height: h } = img;
      if (w > h) {
        ctx.drawImage(img, (w-h)/2, 0, h, h, 0, 0, size, size);
      } else {
        ctx.drawImage(img, 0, (h-w)/2, w, w, 0, 0, size, size);
      }
      res(canvas.toDataURL('image/jpeg'));
    };
    img.src = dataUrl;
  });
}

export default function App() {
  // Which panel is open
  const [openPanel, setOpenPanel] = useState(1);

  // Configuration
  const [config, setConfig] = useState({ count: 4, mode: 'upload', theme: THEMES[1] });
  const [configDone, setConfigDone] = useState(false);

  // Photos
  const [originals, setOriginals] = useState([]);
  const [images, setImages]     = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const webcamRef = useRef(null);

  // Error banner
  const [error, setError] = useState('');

  // Step 1: Finish config
  const handleConfigSubmit = () => {
    setError('');
    setOriginals([]);
    setImages([]);
    setEditingIndex(null);
    setConfigDone(true);
    setOpenPanel(2);
  };

  // Step 2a: Upload photos
  const handleFiles = async e => {
    const selected = Array.from(e.target.files).slice(0, config.count);
    if (e.target.files.length > config.count) {
      setError(`Only the first ${config.count} photos will be used.`);
    } else {
      setError('');
    }
    const dataUrls = await Promise.all(
      selected.map(f => new Promise(r => {
        const rdr = new FileReader();
        rdr.onload = () => r(rdr.result);
        rdr.readAsDataURL(f);
      }))
    );
    setOriginals(dataUrls);
    const squares = await Promise.all(dataUrls.map(url => cropToSquare(url)));
    setImages(squares);
    setOpenPanel(3);
  };

  // Step 2b: Capture from webcam
  const capturePhoto = async () => {
    if (images.length >= config.count) {
      setError(`Max ${config.count} reached.`);
      return;
    }
    setError('');
    const shot = webcamRef.current.getScreenshot();
    if (!shot) return;
    setOriginals(orig => [...orig, shot]);
    const sq = await cropToSquare(shot);
    setImages(imgs => [...imgs, sq]);
    setOpenPanel(3);
  };

  // Step 3: Manual crop
  const applyCropped = url => {
    setImages(imgs => imgs.map((img, i) => i === editingIndex ? url : img));
    setEditingIndex(null);
  };

  // Step 4: Generate & download PNG
  const generatePNG = async () => {
    if (!images.length) {
      setError('Add at least one photo.');
      return;
    }
    setError('');
    const size = 400, border = 1, padding = 20, gap = 10;
    const W = size + border*2 + padding*2;
    const H = padding*2 + images.length*(size+border*2) + (images.length-1)*gap;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H);

    for (let i = 0; i < images.length; i++) {
      const imgEl = new Image();
      await new Promise(r => { imgEl.onload = r; imgEl.src = images[i]; });
      const x = padding + border;
      const y = padding + i*((size+border*2)+gap) + border;
      ctx.strokeStyle = '#000'; ctx.lineWidth = border;
      ctx.strokeRect(x-border, y-border, size+border*2, size+border*2);
      ctx.drawImage(imgEl, x, y, size, size);
    }

    canvas.toBlob(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'photostrip.png';
      link.click();
    }, 'image/png');
  };

  return (
    <div className="container">
      {/* Panel 1: Configuration */}
      <Collapsible
        id={1}
        title="1. Configuration"
        isOpen={openPanel===1}
        onToggle={setOpenPanel}
        disabled={false}
      >
        <label>
          Number of Photos (1–4):
          <input
            type="number" min={1} max={MAX_PHOTOS}
            value={config.count}
            onChange={e=>setConfig({...config, count:+e.target.value})}
          />
        </label>
        <label>
          Mode:
          <select
            value={config.mode}
            onChange={e=>setConfig({...config, mode:e.target.value})}
          >
            <option value="upload">Upload</option>
            <option value="camera">Camera</option>
          </select>
        </label>
        <label>
          Theme:
          <select
            value={config.theme}
            onChange={e=>setConfig({...config, theme:e.target.value})}
          >
            {THEMES.map(t=> <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <button onClick={handleConfigSubmit}>Proceed</button>
      </Collapsible>

      {/* Panel 2: Photo Capture */}
      <Collapsible
        id={2}
        title="2. Photo Capture"
        isOpen={openPanel===2}
        onToggle={setOpenPanel}
        disabled={!configDone}
      >
        {config.mode === 'camera' ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode:'user' }}
            />
            <button onClick={capturePhoto}>Capture</button>
          </>
        ) : (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
          />
        )}
        <p>Captured: {images.length} / {config.count}</p>
      </Collapsible>

      {/* Panel 3: Photostrip */}
      <Collapsible
        id={3}
        title="3. Photostrip"
        isOpen={openPanel===3}
        onToggle={setOpenPanel}
        disabled={images.length < 1}
      >
        <div className="preview">
          {images.map((src,i) => (
            <div key={i} className="thumb-wrapper">
              <img src={src} alt="" />
              <button onClick={()=>setEditingIndex(i)}>Crop</button>
            </div>
          ))}
        </div>
        <button onClick={generatePNG}>Download Strip</button>
      </Collapsible>

      {error && <div className="error-banner">{error}</div>}

      {editingIndex !== null && (
        <CropModal
          src={originals[editingIndex]}
          onCancel={()=>setEditingIndex(null)}
          onComplete={applyCropped}
        />
      )}
    </div>
  );
}
