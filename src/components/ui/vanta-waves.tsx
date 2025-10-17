import { useEffect, useRef } from 'react';

// Extend window to include VANTA
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    VANTA: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any;
  }
}

interface VantaWavesProps {
  children?: React.ReactNode;
  color?: number;
  shininess?: number;
  waveHeight?: number;
  waveSpeed?: number;
  zoom?: number;
  enableMovement?: boolean;
}

export default function VantaWaves({
  children,
  color = 0xe14,
  shininess = 30,
  waveHeight = 15,
  waveSpeed = 0.5,
  zoom = 1.0,
  enableMovement = true
}: VantaWavesProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      // Wait for VANTA to load
      const initVanta = () => {
        if (window.VANTA && window.THREE) {
          vantaEffect.current = window.VANTA.WAVES({
            el: vantaRef.current,
            THREE: window.THREE,
            mouseControls: enableMovement,
            touchControls: enableMovement,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: zoom,
            scaleMobile: 1.00,
            color: color,
            shininess: shininess,
            waveHeight: waveHeight,
            waveSpeed: enableMovement ? waveSpeed : 0,
            zoom: zoom
          });
        }
      };

      // Check if VANTA is already loaded
      if (window.VANTA) {
        initVanta();
      } else {
        // Wait for scripts to load
        const checkVanta = setInterval(() => {
          if (window.VANTA) {
            clearInterval(checkVanta);
            initVanta();
          }
        }, 100);

        return () => clearInterval(checkVanta);
      }
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [color, shininess, waveHeight, waveSpeed, zoom, enableMovement]);

  return (
    <div ref={vantaRef} className="vanta-container">
      {children}
    </div>
  );
}
