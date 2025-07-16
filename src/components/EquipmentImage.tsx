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
  maxRetries?: number; // Maximum number of retry attempts
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
  showFallback = true,
  maxRetries = 3
}: EquipmentImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Reset image state when src changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setRetryCount(0);
    setCurrentSrc(src);
  }, [src]);

  // Retry logic for failed images
  const handleImageError = () => {
    if (retryCount < maxRetries) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // Add a small delay before retry to avoid rapid retries
      setTimeout(() => {
        // Force image reload by adding a cache-busting parameter
        const separator = currentSrc?.includes('?') ? '&' : '?';
        setCurrentSrc(`${src}${separator}_retry=${newRetryCount}&_t=${Date.now()}`);
      }, 1000 * newRetryCount); // Exponential backoff: 1s, 2s, 3s
    } else {
      setImageError(true);
    }
  };

  const sizeClass = sizeClasses[size];

  // Notify parent component about image status
  const hasActualImage = src && !imageError && imageLoaded;
  
  useEffect(() => {
    onImageStatusChange?.(hasActualImage);
  }, [hasActualImage, onImageStatusChange, src, imageError, imageLoaded]);

  // If no src provided or image failed to load after all retries
  if (!src || imageError) {
    if (!showFallback) {
      return null; // Don't render anything
    }
    return (
      <div className={`${sizeClass} flex items-center justify-center bg-gray-100 rounded ${className}`}>
        <FallbackIcon className="w-4 h-4 text-gray-400" />
        {retryCount > 0 && retryCount <= maxRetries && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" 
               title={`Retrying... (${retryCount}/${maxRetries})`} />
        )}
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
      {retryCount > 0 && retryCount <= maxRetries && !imageLoaded && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" 
             title={`Retrying... (${retryCount}/${maxRetries})`} />
      )}
      <img
        src={currentSrc}
        alt={alt || "Equipment"}
        className={`${sizeClass} object-contain rounded ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        onLoad={() => {
          setImageLoaded(true);
        }}
        onError={handleImageError}
      />
    </div>
  );
};
