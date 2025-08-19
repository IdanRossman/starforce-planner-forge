// Test component to verify the new StarForceCalculator structure works
import React from 'react';
import { StarForceCalculator } from './index';

export function StarForceCalculatorTest() {
  const testEquipment = [
    {
      id: 'test-1',
      name: 'Test Weapon',
      slot: 'weapon',
      type: 'weapon',
      level: 200,
      starforceable: true,
      currentStarForce: 0,
      targetStarForce: 17
    }
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">StarForce Calculator Test</h1>
      <StarForceCalculator 
        equipment={testEquipment}
        characterName="Test Character"
      />
    </div>
  );
}
