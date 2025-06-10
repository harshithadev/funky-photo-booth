// src/App.jsx
import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import CropModal from './CropModal';
import './styles.css';

// Simple Accordion Panel component
function Panel({ number, title, isOpen, onToggle, disabled, children }) {
  return (
    <div className={`panel ${disabled ? 'panel-disabled' : ''}`}>
      <button
        className="panel-header"
        onClick={() => !disabled && onToggle(number)}
      >
        <span className="panel-title">{number}. {title}</span>
        <span className="panel-chevron">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && <div className="panel-content">{children}</div>}
    </div>
  );
}

// Helper to center-crop any Data-URL image into a size×size square
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
  const MAX_PHOTOS = 4;
  const THEMES = ['Classic','Minimal','Retro'];

  // Wizard state
  const [openPanel, setOpenPanel] = useState(1);
  const [config, setConfig] = useState({ count: 4, mode: 'upload', theme: THEMES[1] });
  const [configDone, setConfigDone] = useState(false);

  // Photo state
  const [originals, setOriginals] = useState([]);
  const [images, setImages]     = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const webcamRef = useRef();

  const [error, setError] = useState('');

  // Panel toggle: only one open at once
  const handleToggle = (num) => setOpenPanel(num);

  // --- Panel 1: Configuration ---
  const handleConfigSubmit = () => {
    setError('');
    setOriginals([]);
    setImages([]);
    setEditingIndex(null);
    setConfigDone(true);
    setOpenPanel(2);
  };

  // --- Panel 2: Photo Capture ---
  const handleFiles = async e => {
    const files = Array.from(e.target.files).slice(0, config.count);
    if (e.target.files.length > config.count) {
      setError(`Only first ${config.count} used.`);
    } else {
      setError('');
    }
    const dataUrls = await Promise.all(
      files.map(f => new Promise(r => {
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

  const capturePhoto = async () => {
    if (images.length >= config.count) {
      setError(`Max ${config.count} reached.`);
      return;
    }
    setError('');
    const shot = webcamRef.current.getScreenshot();
    if (!shot) return;
    const newOrig = [...originals, shot];
    setOriginals(newOrig);
    const sq = await cropToSquare(shot);
    setImages([...images, sq]);
    setOpenPanel(3);
  };

  // --- Panel 3: Photostrip ---
  const applyCropped = url => {
    setImages(images.map((img,i) => i===editingIndex?url:img));
    setEditingIndex(null);
  };

  const generatePNG = async () => {
    if (!images.length) {
      setError('Add at least one photo.');
      return;
    }
    setError('');
    const size=400, border=1, padding=20, gap=10;
    const w = size + border*2 + padding*2;
    const h = padding*2 + images.length*(size+border*2) + (images.length-1)*gap;
    const canvas = document.createElement('canvas');
    canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);

    for (let i=0;i<images.length;i++){
      const imgEl=new Image();
      await new Promise(r=>{imgEl.onload=r; imgEl.src=images[i];});
      const x=padding+border;
      const y=padding + i*((size+border*2)+gap) + border;
      ctx.strokeStyle='#000'; ctx.lineWidth=border;
      ctx.strokeRect(x-border,y-border,size+border*2,size+border*2);
      ctx.drawImage(imgEl,x,y,size,size);
    }

    canvas.toBlob(blob=>{
      const link=document.createElement('a');
      link.href=URL.createObjectURL(blob);
      link.download='photostrip.png';
      link.click();
    },'image/png');
  };

  return (
    <div className="container">
      <Panel
        number={1}
        title="Configuration"
        isOpen={openPanel===1}
        onToggle={handleToggle}
      >
        <label>
          Number of Photos (1–4):
          <input
            type="number" min={1} max={MAX_PHOTOS}
            value={config.count}
            onChange={e=>setConfig({...config,count:+e.target.value})}
          />
        </label>

        <label>
          Mode:
          <select
            value={config.mode}
            onChange={e=>setConfig({...config,mode:e.target.value})}
          >
            <option value="upload">Upload</option>
            <option value="camera">Camera</option>
          </select>
        </label>

        <label>
          Theme:
          <select
            value={config.theme}
            onChange={e=>setConfig({...config,theme:e.target.value})}
          >
            {THEMES.map(t=>(
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <button onClick={handleConfigSubmit}>Proceed</button>
      </Panel>

      <Panel
        number={2}
        title="Photo Capture"
        isOpen={openPanel===2}
        onToggle={handleToggle}
        disabled={!configDone}
      >
        {config.mode === 'camera' ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{facingMode:'user'}}
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
      </Panel>

      <Panel
        number={3}
        title="Photostrip"
        isOpen={openPanel===3}
        onToggle={handleToggle}
        disabled={images.length < 1}
      >
        <div className="preview">
          {images.map((src,i)=>(
            <div key={i} className="thumb-wrapper">
              <img src={src} alt="" />
              <button onClick={()=>setEditingIndex(i)}>Crop</button>
            </div>
          ))}
        </div>
        <button onClick={generatePNG}>Download Strip</button>
      </Panel>

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
