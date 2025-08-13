import { useState, useEffect } from 'react';
import { StarforceStrategy } from '@/services/starforceService';

// Hook to get the current starforce system configuration from localStorage
export function useStarforceStrategy(): [StarforceStrategy, (strategy: StarforceStrategy) => void] {
  const [strategy, setStrategy] = useState<StarforceStrategy>(() => {
    const saved = localStorage.getItem('starforce-global-system');
    return (saved as StarforceStrategy) || StarforceStrategy.LEGACY;
  });

  const updateStrategy = (newStrategy: StarforceStrategy) => {
    setStrategy(newStrategy);
    localStorage.setItem('starforce-global-system', newStrategy);
    window.dispatchEvent(new CustomEvent('starforce-system-changed', { 
      detail: { strategy: newStrategy } 
    }));
  };

  useEffect(() => {
    const handleStrategyEvent = (event: CustomEvent) => {
      const newStrategy = event.detail.strategy;
      if (newStrategy !== strategy) {
        setStrategy(newStrategy);
      }
    };

    window.addEventListener('starforce-system-changed', handleStrategyEvent as EventListener);
    
    return () => {
      window.removeEventListener('starforce-system-changed', handleStrategyEvent as EventListener);
    };
  }, [strategy]);

  return [strategy, updateStrategy];
}
