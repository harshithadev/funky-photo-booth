
import React, { useState } from 'react';
import ConfigurationPanel from './ConfigurationPanel';
import PhotoCapturePanel from './PhotoCapturePanel';
import PhotostripPanel from './PhotostripPanel';

export interface PhotoboothConfig {
  photoCount: 3 | 4 | 6;
  mode: 'camera' | 'upload';
  theme: 'retro' | 'minimalistic' | 'modern' | 'vintage' | 'neon';
}

export interface CapturedPhoto {
  id: string;
  url: string;
  blob?: Blob;
}

const PhotoboothApp = () => {
  const [activePanel, setActivePanel] = useState<'config' | 'capture' | 'strip'>('config');
  const [config, setConfig] = useState<PhotoboothConfig>({
    photoCount: 4,
    mode: 'upload',
    theme: 'retro'
  });
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);

  const handleConfigNext = (newConfig: PhotoboothConfig) => {
    setConfig(newConfig);
    setActivePanel('capture');
  };

  const handlePhotosNext = (capturedPhotos: CapturedPhoto[]) => {
    setPhotos(capturedPhotos);
    setActivePanel('strip');
  };

  const handleStartOver = () => {
    setActivePanel('config');
    setPhotos([]);
    setConfig({
      photoCount: 4,
      mode: 'upload',
      theme: 'retro'
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="h-screen w-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800 font-playfair">
              📸 Photobooth Studio
            </h1>
            <p className="text-slate-600 text-sm font-dancing">Create beautiful photo strips in seconds</p>
          </div>
        </div>

        {/* Panels Container - Responsive Layout */}
        <div className="flex-1 flex lg:flex-row flex-col p-6 gap-6">
          {/* Configuration Panel */}
          <div className={`transition-all duration-500 ease-in-out ${
            activePanel === 'config' 
              ? 'lg:flex-1 flex-1' 
              : 'lg:w-20 h-16 lg:h-auto'
          } bg-gradient-to-br from-blue-50 via-white to-indigo-50 backdrop-blur-sm border border-blue-200/60 shadow-lg rounded-2xl overflow-hidden`}>
            <ConfigurationPanel
              isActive={activePanel === 'config'}
              config={config}
              onNext={handleConfigNext}
              onReopen={activePanel !== 'config' ? () => {} : undefined}
            />
          </div>

          {/* Photo Capture Panel */}
          <div className={`transition-all duration-500 ease-in-out ${
            activePanel === 'capture' 
              ? 'lg:flex-1 flex-1' 
              : 'lg:w-20 h-16 lg:h-auto'
          } bg-gradient-to-br from-emerald-50 via-white to-teal-50 backdrop-blur-sm border border-emerald-200/60 shadow-lg rounded-2xl overflow-hidden`}>
            <PhotoCapturePanel
              isActive={activePanel === 'capture'}
              config={config}
              onNext={handlePhotosNext}
              onBack={() => setActivePanel('config')}
              onReopen={activePanel !== 'capture' ? () => {} : undefined}
            />
          </div>

          {/* Photostrip Panel */}
          <div className={`transition-all duration-500 ease-in-out ${
            activePanel === 'strip' 
              ? 'lg:flex-1 flex-1' 
              : 'lg:w-20 h-16 lg:h-auto'
          } bg-gradient-to-br from-violet-50 via-white to-purple-50 backdrop-blur-sm border border-violet-200/60 shadow-lg rounded-2xl overflow-hidden`}>
            <PhotostripPanel
              isActive={activePanel === 'strip'}
              config={config}
              photos={photos}
              onStartOver={handleStartOver}
              onBack={() => setActivePanel('capture')}
              onReopen={activePanel !== 'strip' ? () => {} : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoboothApp;
