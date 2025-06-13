
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoboothConfig } from './PhotoboothApp';
import { Camera, Upload, Palette, Images } from 'lucide-react';

interface ConfigurationPanelProps {
  isActive: boolean;
  config: PhotoboothConfig;
  onNext: (config: PhotoboothConfig) => void;
  onReopen?: () => void;
}

const ConfigurationPanel = ({ isActive, config, onNext, onReopen }: ConfigurationPanelProps) => {
  const [localConfig, setLocalConfig] = useState<PhotoboothConfig>(config);

  const handleNext = () => {
    onNext(localConfig);
  };

  if (!isActive) {
    return (
      <div 
        className="h-full bg-gradient-to-br from-blue-100 to-indigo-200 cursor-pointer group hover:from-blue-200 hover:to-indigo-300 transition-all duration-300 flex items-center justify-center" 
        onClick={onReopen}
      >
        <div className="lg:block hidden w-2 h-32 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full group-hover:w-3 group-hover:h-40 transition-all duration-300"></div>
        <div className="lg:hidden block text-blue-700 font-medium">Configuration</div>
      </div>
    );
  }

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold">1</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Configuration</h2>
            <p className="text-slate-600">Set up your photobooth</p>
          </div>
        </div>

        <div className="space-y-10">
          {/* Photo Count */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Images className="w-5 h-5 text-slate-600" />
              <Label className="font-medium text-slate-700">Number of Photos</Label>
            </div>
            <RadioGroup
              value={localConfig.photoCount.toString()}
              onValueChange={(value) => setLocalConfig({ ...localConfig, photoCount: parseInt(value) as 3 | 4 | 6 })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-3 bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <RadioGroupItem value="3" id="count-3" />
                <Label htmlFor="count-3" className="cursor-pointer text-slate-700 font-medium">3 Photos</Label>
              </div>
              <div className="flex items-center space-x-3 bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <RadioGroupItem value="4" id="count-4" />
                <Label htmlFor="count-4" className="cursor-pointer text-slate-700 font-medium">4 Photos</Label>
              </div>
              <div className="flex items-center space-x-3 bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <RadioGroupItem value="6" id="count-6" />
                <Label htmlFor="count-6" className="cursor-pointer text-slate-700 font-medium">6 Photos</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mode Selection */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-slate-600" />
              <Label className="font-medium text-slate-700">Photo Mode</Label>
            </div>
            <RadioGroup
              value={localConfig.mode}
              onValueChange={(value) => setLocalConfig({ ...localConfig, mode: value as 'camera' | 'upload' })}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <RadioGroupItem value="camera" id="mode-camera" />
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-slate-600" />
                  <Label htmlFor="mode-camera" className="cursor-pointer text-slate-700 font-medium">Camera</Label>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <RadioGroupItem value="upload" id="mode-upload" />
                <div className="flex items-center gap-3">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <Label htmlFor="mode-upload" className="cursor-pointer text-slate-700 font-medium">Upload</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Theme Selection */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-slate-600" />
              <Label className="font-medium text-slate-700">Theme</Label>
            </div>
            <Select
              value={localConfig.theme}
              onValueChange={(value) => setLocalConfig({ ...localConfig, theme: value as PhotoboothConfig['theme'] })}
            >
              <SelectTrigger className="w-full p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retro">
                  <div>
                    <div className="font-medium">Retro</div>
                    <div className="text-sm text-slate-600">Vintage vibes with warm colors</div>
                  </div>
                </SelectItem>
                <SelectItem value="minimalistic">
                  <div>
                    <div className="font-medium">Minimalistic</div>
                    <div className="text-sm text-slate-600">Clean and modern design</div>
                  </div>
                </SelectItem>
                <SelectItem value="modern">
                  <div>
                    <div className="font-medium">Modern</div>
                    <div className="text-sm text-slate-600">Contemporary and sleek</div>
                  </div>
                </SelectItem>
                <SelectItem value="vintage">
                  <div>
                    <div className="font-medium">Vintage</div>
                    <div className="text-sm text-slate-600">Classic nostalgic feel</div>
                  </div>
                </SelectItem>
                <SelectItem value="neon">
                  <div>
                    <div className="font-medium">Neon</div>
                    <div className="text-sm text-slate-600">Bright and vibrant colors</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleNext} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-4 shadow-lg hover:shadow-xl transition-all duration-200" 
            size="lg"
          >
            Continue to Photos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
