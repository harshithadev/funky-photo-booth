import { useState } from 'react';
import './styles.css';
import CropModal from './CropModal';

// Helper: center-crop any Data-URL image into a size×size square
function cropToSquare(dataUrl, size = 400) {
  return new Promise((res) => {
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
  // cropped, auto‐squared images for preview/export
  const [images, setImages] = useState([]);
  // originals straight from FileReader
  const [originals, setOriginals] = useState([]);
  // index of the thumbnail being manually re-cropped
  const [editingIndex, setEditingIndex] = useState(null);

  // 1) Read files → store originals → auto-crop squares → store images
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);

    // A) Read originals
    const dataUrls = await Promise.all(
      files.map(f =>
        new Promise(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(f);
        })
      )
    );
    setOriginals(dataUrls);

    // B) Auto-crop each to 400×400
    const squares = await Promise.all(
      dataUrls.map(url => cropToSquare(url, 400))
    );
    setImages(squares);
  };

  // 2) When user completes a manual crop, update only the cropped array
  const applyCropped = (dataUrl) => {
    setImages(imgs =>
      imgs.map((src, i) => (i === editingIndex ? dataUrl : src))
    );
    setEditingIndex(null);
  };

  // 3) Export strip as PNG (same as before)
  const generatePNG = async () => {
    if (!images.length) {
      alert('Select at least one image');
      return;
    }
    const size = 400, border = 1, padding = 20, gap = 10;
    const width  = size + border * 2 + padding * 2;
    const height = padding * 2 + images.length * (size + border*2) + (images.length-1)*gap;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
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
      const y = padding + i * ((size + border*2) + gap) + border;
      ctx.strokeStyle = '#000'; ctx.lineWidth = border;
      ctx.strokeRect(x - border, y - border, size + border*2, size + border*2);
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
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFiles}
        />
        <button onClick={generatePNG}>
          Download Strip as PNG
        </button>
      </div>

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
          // feed the original image for manual re-crop:
          src={originals[editingIndex]}
          onCancel={() => setEditingIndex(null)}
          onComplete={applyCropped}
        />
      )}
    </div>
  );
}
