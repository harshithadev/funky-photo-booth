import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function CropModal({ src, onCancel, onComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // get pixel coords from the UI
  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // draw the cropped  square and return DataURL
  const makeCrop = useCallback(async () => {
    const image = new Image();
    image.src = src;
    await image.decode();

    const canvas = document.createElement('canvas');
    const size = Math.min(image.width, image.height);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const { x, y, width, height } = croppedAreaPixels;

    // draw the cropped area onto the square canvas
    ctx.drawImage(
      image,
      x, y, width, height,
      0, 0, size, size,
    );

    onComplete(canvas.toDataURL('image/jpeg'));
  }, [croppedAreaPixels, onComplete, src]);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Adjust the Square</h2>
        <div className="crop-container">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="controls">
          <label>
            Zoom: 
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
            />
          </label>
          <button onClick={makeCrop}>Done</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
