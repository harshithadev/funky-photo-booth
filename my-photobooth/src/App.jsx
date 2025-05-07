import { useState } from 'react';
import './styles.css';

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
        // crop sides
        const x0 = (w - h) / 2;
        ctx.drawImage(img, x0, 0, h, h, 0, 0, size, size);
      } else {
        // crop top/bottom
        const y0 = (h - w) / 2;
        ctx.drawImage(img, 0, y0, w, w, 0, 0, size, size);
      }

      res(canvas.toDataURL('image/jpeg'));
    };
    img.src = dataUrl;
  });
}

export default function App() {
  const [images, setImages] = useState([]);

  // Read → crop → store squares
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    const dataUrls = await Promise.all(
      files.map(f => new Promise(r => {
        const reader = new FileReader();
        reader.onload = () => r(reader.result);
        reader.readAsDataURL(f);
      }))
    );
    const squares = await Promise.all(
      dataUrls.map(url => cropToSquare(url, 400))
    );
    setImages(squares);
  };

  // Draw strip to canvas & download as PNG
  const generatePNG = async () => {
    if (!images.length) {
      alert('Select at least one image');
      return;
    }

    const size = 400;       // each square is 400×400
    const border = 1;       // 1px border around each photo
    const padding = 20;     // white padding around entire strip
    const gap = 10;         // vertical gap between photos

    // Canvas dimensions
    const width  = size + border * 2 + padding * 2;
    const height =
      padding * 2 +
      images.length * (size + border * 2) +
      (images.length - 1) * gap;

    // Create off-screen canvas
    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw each photo + border
    for (let i = 0; i < images.length; i++) {
      // Wait for image to load
      const imgEl = new Image();
      await new Promise(r => {
        imgEl.onload = r;
        imgEl.src = images[i];
      });

      const x = padding + border;
      const y = padding + i * ((size + border * 2) + gap) + border;

      // Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = border;
      ctx.strokeRect(
        x - border,
        y - border,
        size + border * 2,
        size + border * 2
      );

      // Photo
      ctx.drawImage(imgEl, x, y, size, size);
    }

    // Download
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
          <img key={i} src={src} alt={`Preview ${i}`} />
        ))}
      </div>
    </div>
  );
}
