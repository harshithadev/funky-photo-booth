
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PhotoboothConfig, CapturedPhoto } from './PhotoboothApp';
import { Download, ArrowLeft, RotateCcw, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PhotostripPanelProps {
  isActive: boolean;
  config: PhotoboothConfig;
  photos: CapturedPhoto[];
  onStartOver: () => void;
  onBack: () => void;
  onReopen?: () => void;
}

const PhotostripPanel = ({ isActive, config, photos, onStartOver, onBack, onReopen }: PhotostripPanelProps) => {
  const stripRef = useRef<HTMLDivElement>(null);

  const downloadStrip = async (format: 'png' | 'pdf') => {
    if (!stripRef.current) return;

    try {
      // Create a new canvas to render the photostrip
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions for a photostrip
      const stripWidth = 400;
      const photoHeight = 300;
      const spacing = 20;
      const headerHeight = 80;
      
      // For 6 photos, arrange in 2 columns
      if (config.photoCount === 6) {
        canvas.width = stripWidth * 2 + spacing;
        canvas.height = headerHeight + (photoHeight + spacing) * 3 + spacing;
      } else {
        canvas.width = stripWidth;
        canvas.height = headerHeight + (photoHeight + spacing) * config.photoCount + spacing;
      }

      // Set background based on theme
      if (config.theme === 'retro') {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#fef7cd');
        gradient.addColorStop(1, '#fbbf24');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add header
      ctx.fillStyle = config.theme === 'retro' ? '#92400e' : '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FUNKY PHOTOBOOTH', canvas.width / 2, 40);
      
      ctx.font = '14px Arial';
      ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, 65);

      // Load and draw photos
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      for (let i = 0; i < photos.length; i++) {
        try {
          const img = await loadImage(photos[i].url);
          
          let x, y, photoWidth;
          
          if (config.photoCount === 6) {
            // 2 columns, 3 rows layout
            const col = i % 2;
            const row = Math.floor(i / 2);
            photoWidth = stripWidth - spacing * 2;
            x = spacing + col * (stripWidth + spacing / 2);
            y = headerHeight + spacing + row * (photoHeight + spacing);
          } else {
            // Single column layout
            photoWidth = stripWidth - spacing * 2;
            x = spacing;
            y = headerHeight + spacing + (photoHeight + spacing) * i;
          }
          
          // Draw photo with border
          if (config.theme === 'retro') {
            ctx.fillStyle = '#92400e';
            ctx.fillRect(x - 5, y - 5, photoWidth + 10, photoHeight + 10);
          }
          
          ctx.drawImage(img, x, y, photoWidth, photoHeight);
        } catch (error) {
          console.error('Error loading image:', error);
        }
      }

      if (format === 'png') {
        // Convert canvas to blob and download as PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `funky-photostrip-${config.theme}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast({
              title: "PNG Download started!",
              description: "Your photostrip is being downloaded as PNG.",
            });
          }
        }, 'image/png');
      } else {
        // Create PDF version
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
          orientation: config.photoCount === 6 ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`funky-photostrip-${config.theme}-${Date.now()}.pdf`);
        
        toast({
          title: "PDF Download started!",
          description: "Your photostrip is being downloaded as PDF.",
        });
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error creating your photostrip.",
        variant: "destructive"
      });
    }
  };

  const getPhotostripLayout = () => {
    if (config.photoCount === 6) {
      return 'grid-cols-2 gap-3';
    }
    return 'grid-cols-1 gap-4';
  };

  if (!isActive) {
    return (
      <div 
        className="h-full bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer group hover:from-slate-200 hover:to-slate-300 transition-all duration-300 flex items-center justify-center" 
        onClick={onReopen}
      >
        <div className="lg:block hidden w-2 h-32 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full group-hover:w-3 group-hover:h-40 transition-all duration-300"></div>
        <div className="lg:hidden block text-slate-600 font-medium">Photostrip</div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold">3</span>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-800">Your Photostrip</h2>
            <p className="text-slate-600">Preview and download your creation</p>
          </div>
        </div>

        {/* Centered Layout */}
        <div className="flex justify-center">
          <div className="lg:flex lg:gap-8 lg:items-start space-y-8 lg:space-y-0">
            {/* Photostrip Preview - Smaller size */}
            <div className="flex justify-center">
              <div 
                ref={stripRef}
                className={`w-48 rounded-xl shadow-lg overflow-hidden border ${
                  config.theme === 'retro' 
                    ? 'bg-gradient-to-b from-amber-50 to-orange-100 border-amber-200' 
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Header */}
                <div className={`text-center py-3 ${
                  config.theme === 'retro' ? 'text-amber-800' : 'text-slate-800'
                }`}>
                  <h3 className="text-xs font-semibold">FUNKY PHOTOBOOTH</h3>
                  <p className="text-xs mt-1">{new Date().toLocaleDateString()}</p>
                </div>
                
                {/* Photos */}
                <div className="px-3 pb-3">
                  <div className={`grid ${getPhotostripLayout()}`}>
                    {photos.map((photo, index) => (
                      <div 
                        key={photo.id} 
                        className={`relative ${
                          config.theme === 'retro' 
                            ? 'border border-amber-300 shadow-sm' 
                            : 'border border-slate-300 shadow-sm'
                        } rounded overflow-hidden`}
                      >
                        <img 
                          src={photo.url} 
                          alt={`Photo ${index + 1}`}
                          className={`w-full object-cover ${config.photoCount === 6 ? 'h-16' : 'h-20'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:w-56 space-y-3">
              <Button onClick={() => downloadStrip('png')} className="w-full bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white font-medium py-3 shadow-lg hover:shadow-xl transition-all duration-200" size="default">
                <Download className="w-4 h-4 mr-2" />
                Download (PNG)
              </Button>
              
              <Button onClick={() => downloadStrip('pdf')} variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3">
                <FileText className="w-4 h-4 mr-2" />
                Download (PDF)
              </Button>
              
              <Button variant="outline" onClick={onBack} className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button variant="outline" onClick={onStartOver} className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotostripPanel;
