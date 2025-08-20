import React from 'react';
import { StarForceCalculatorTable } from './StarForceCalculatorTable';
import { StarForceCalculatorProps } from './types/table';

/**
 * Main StarForce Calculator entry point
 * This acts as a router/wrapper that will delegate to the appropriate component
 * For now, it only handles the table mode since standalone was removed
 */
export function StarForceCalculator(props: StarForceCalculatorProps) {
  // Since standalone mode was removed, we always render the table component
  return <StarForceCalculatorTable {...props} />;
}

// Make it the default export as well
export default StarForceCalculator;

// Re-export types for convenience
export type { StarForceCalculatorProps } from './types/table';

// Re-export the table component for direct usage if needed
export { StarForceCalculatorTable } from './StarForceCalculatorTable';
