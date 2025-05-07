import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import './styles.css';
import CropModal from './CropModal';

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

  // raw originals & auto-cropped squares
  const [originals, setOriginals] = useState([]);
  const [images, setImages]     = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError]       = useState('');

  // camera vs upload
  const [useCamera, setUseCamera] = useState(false);
  const webcamRef = useRef(null);

  // -- 1) FILE UPLOAD --
  const handleFiles = async e => {
    const files = Array.from(e.target.files);
    if (files.length > MAX_IMAGES) {
      setError(`Only the first ${MAX_IMAGES} are used.`);
    } else {
      setError('');
    }
    const selected = files.slice(0, MAX_IMAGES);
    // read originals
    const dataUrls = await Promise.all(
      selected.map(f => new Promise(r => {
        const rdr = new FileReader();
        rdr.onload = () => r(rdr.result);
        rdr.readAsDataURL(f);
      }))
    );
    setOriginals(dataUrls);
    // auto-crop
    const squares = await Promise.all(dataUrls.map(url => cropToSquare(url, 400)));
    setImages(squares);
  };

  // -- 2) CAMERA CAPTURE --
  const capturePhoto = async () => {
    if (images.length >= MAX_IMAGES) {
      setError(`Max ${MAX_IMAGES} photos reached.`);
      return;
    }
    setError('');
    const screenshot = webcamRef.current.getScreenshot();         // JPEG Data-URL
    if (!screenshot) return;
    // add to originals & images
    const newOriginals = [...originals, screenshot];
    setOriginals(newOriginals);
    const square = await cropToSquare(screenshot, 400);
    setImages(imgs => [...imgs, square]);
  };

  // -- 3) APPLY MANUAL CROP --
  const applyCropped = dataUrl => {
    setImages(imgs => imgs.map((src,i) => i===editingIndex ? dataUrl : src));
    setEditingIndex(null);
  };

  // -- 4) GENERATE PNG STRIP --
  const generatePNG = async () => {
    if (!images.length) { setError('Select at least one photo.'); return; }
    setError('');
    const size=400, border=1, padding=20, gap=10;
    const w = size + border*2 + padding*2;
    const h = padding*2 + images.length*(size+border*2) + (images.length-1)*gap;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);

    for (let i=0; i<images.length; i++){
      const imgEl = new Image();
      await new Promise(r => { imgEl.onload = r; imgEl.src = images[i]; });
      const x = padding + border;
      const y = padding + i*((size+border*2)+gap) + border;
      ctx.strokeStyle='#000'; ctx.lineWidth=border;
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
    <div className="container">
      <h1>📸 Photo Booth</h1>

      <div className="controls">
        <button
          className={useCamera? 'active': ''}
          onClick={() => setUseCamera(true)}
        >Camera</button>
        <button
          className={!useCamera? 'active': ''}
          onClick={() => setUseCamera(false)}
        >Upload</button>

        {useCamera ? (
          <div className="camera">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user' }}
            />
            <button onClick={capturePhoto} disabled={images.length>=MAX_IMAGES}>
              Capture
            </button>
          </div>
        ) : (
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFiles}
            disabled={images.length>=MAX_IMAGES}
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
          <button className="dismiss" onClick={()=>setError('')}>×</button>
        </div>
      )}

      <div className="preview">
        {images.map((src,i) => (
          <div key={i} className="thumb-wrapper">
            <img src={src} alt={`Preview ${i}`} />
            <button onClick={()=>setEditingIndex(i)}>Crop</button>
          </div>
        ))}
      </div>

      {editingIndex!==null && (
        <CropModal
          src={originals[editingIndex]}
          onCancel={()=>setEditingIndex(null)}
          onComplete={applyCropped}
        />
      )}
    </div>
  );
}
