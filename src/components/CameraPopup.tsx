
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { CapturedPhoto } from './PhotoboothApp';

interface CameraPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photo: CapturedPhoto) => void;
  remainingPhotos: number;
}

const CameraPopup = ({ isOpen, onClose, onCapture, remainingPhotos }: CameraPopupProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const newPhoto: CapturedPhoto = {
            id: Date.now().toString(),
            url: canvas.toDataURL(),
            blob: blob
          };
          onCapture(newPhoto);
          
          if (remainingPhotos <= 1) {
            onClose();
          }
        }
      });
    }
  };

  if (!isOpen) return null;

  const totalPhotos = remainingPhotos === 3 ? 3 : remainingPhotos === 2 ? 4 : remainingPhotos === 0 ? 6 : 6;
  const currentPhoto = totalPhotos - remainingPhotos + 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-800">Take Photo</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              className="w-full h-auto max-h-96 object-contain" 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Floating counter in bottom right */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg font-medium text-lg">
              {currentPhoto}/{totalPhotos}
            </div>
          </div>
          
          <Button 
            onClick={capturePhoto} 
            size="lg" 
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-4 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Camera className="w-5 h-5 mr-3" />
            Capture Photo ({remainingPhotos} remaining)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraPopup;
