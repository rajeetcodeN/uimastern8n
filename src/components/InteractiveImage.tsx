import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InteractiveImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export function InteractiveImage({ src, alt, className = "" }: InteractiveImageProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMaximize = () => {
    setIsMaximized(true);
  };

  const handleClose = () => {
    setIsMaximized(false);
  };

  return (
    <>
      <div className="relative group inline-block">
        <img
          src={src}
          alt={alt || "Image"}
          className={`max-w-full h-auto rounded-lg cursor-pointer transition-transform hover:scale-105 ${className}`}
          onClick={handleMaximize}
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={handleMaximize}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isMaximized && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="relative max-w-full max-h-full">
            <Button
              size="sm"
              className="absolute -top-10 right-0 bg-white/10 hover:bg-white/20 text-white"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={src}
              alt={alt || "Maximized image"}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
