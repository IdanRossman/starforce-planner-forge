import { useState, useEffect } from "react";
import { Gem } from "lucide-react";

interface EquipmentImageProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  size?: 'sm' | 'md' | 'lg';
  onImageStatusChange?: (hasImage: boolean) => void;
  showFallback?: boolean; // If false, don't show fallback icon when image fails/missing
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

export const EquipmentImage = ({ 
  src, 
  alt, 
  className = "", 
  fallbackIcon: FallbackIcon = Gem,
  size = 'md',
  onImageStatusChange,
  showFallback = true
}: EquipmentImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeClass = sizeClasses[size];

  // Notify parent component about image status
  const hasActualImage = src && !imageError && imageLoaded;
  
  useEffect(() => {
    onImageStatusChange?.(hasActualImage);
  }, [hasActualImage, onImageStatusChange]);

  // If no src provided or image failed to load
  if (!src || imageError) {
    if (!showFallback) {
      return null; // Don't render anything
    }
    return (
      <div className={`${sizeClass} flex items-center justify-center bg-gray-100 rounded ${className}`}>
        <FallbackIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} relative ${className}`}>
      {!imageLoaded && (
        <div className={`${sizeClass} absolute inset-0 flex items-center justify-center bg-gray-100 rounded`}>
          <FallbackIcon className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt || "Equipment"}
        className={`${sizeClass} object-contain rounded ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};
