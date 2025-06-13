import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PhotoboothConfig, CapturedPhoto } from './PhotoboothApp';
import { Camera, Upload, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PhotoCapturePanelProps {
  isActive: boolean;
  config: PhotoboothConfig;
  onNext: (photos: CapturedPhoto[]) => void;
  onBack: () => void;
  onReopen?: () => void;
}

const PhotoCapturePanel = ({ isActive, config, onNext, onBack, onReopen }: PhotoCapturePanelProps) => {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (photos.length >= config.photoCount) {
        toast({
          title: "Maximum photos reached",
          description: `You can only upload ${config.photoCount} photos.`,
          variant: "destructive"
        });
        return;
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: CapturedPhoto = {
            id: Date.now().toString() + Math.random(),
            url: e.target?.result as string,
            blob: file
          };
          setPhotos(prev => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to take photos.",
        variant: "destructive"
      });
      setIsCapturing(false);
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
          setPhotos(prev => [...prev, newPhoto]);
        }
      });
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(photo => photo.id !== id));
  };

  const handleNext = () => {
    if (photos.length === config.photoCount) {
      onNext(photos);
    } else {
      toast({
        title: "Not enough photos",
        description: `Please capture or upload ${config.photoCount} photos.`,
        variant: "destructive"
      });
    }
  };

  if (!isActive) {
    return (
      <div 
        className="h-full bg-gradient-to-br from-emerald-100 to-teal-200 cursor-pointer group hover:from-emerald-200 hover:to-teal-300 transition-all duration-300 flex items-center justify-center" 
        onClick={onReopen}
      >
        <div className="lg:block hidden w-2 h-32 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full group-hover:w-3 group-hover:h-40 transition-all duration-300"></div>
        <div className="lg:hidden block text-emerald-700 font-medium">Capture Photos</div>
      </div>
    );
  }

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold">2</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Capture Photos</h2>
            <p className="text-slate-600">
              {config.mode === 'camera' ? 'Take' : 'Upload'} {config.photoCount} photos ({photos.length}/{config.photoCount})
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {config.mode === 'upload' ? (
            <div className="space-y-6">
              <Label className="font-medium text-slate-700">Upload Photos</Label>
              <div 
                className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-slate-400 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2 text-slate-700">Click to upload photos</p>
                <p className="text-slate-600">Select up to {config.photoCount} images</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <Label className="font-medium text-slate-700">Camera</Label>
              {!isCapturing ? (
                <div className="text-center space-y-6">
                  <Button onClick={startCamera} size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-4 shadow-lg hover:shadow-xl transition-all duration-200">
                    <Camera className="w-5 h-5 mr-3" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-black max-h-64">
                    <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <Button 
                    onClick={capturePhoto} 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-4 shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={photos.length >= config.photoCount}
                  >
                    <Camera className="w-5 h-5 mr-3" />
                    Capture Photo ({photos.length}/{config.photoCount})
                  </Button>
                </div>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className="space-y-6">
              <Label className="font-medium text-slate-700">Captured Photos</Label>
              <div className="grid grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <img 
                      src={photo.url} 
                      alt={`Captured ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-slate-200 shadow-sm"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-6 h-6 p-0"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-white/90 text-slate-700 px-1.5 py-0.5 rounded text-xs font-medium">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={onBack} className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext} 
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-4 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={photos.length !== config.photoCount}
            >
              Create Strip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCapturePanel;
