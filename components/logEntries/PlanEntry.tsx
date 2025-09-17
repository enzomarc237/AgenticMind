import React from 'react';
import { PlanLogEntry } from '../../types';

interface PlanEntryProps {
  entry: PlanLogEntry;
}

export const PlanEntry: React.FC<PlanEntryProps> = ({ entry }) => {
  return (
    <div>
      <div className="font-bold">Plan</div>
      <ul className="list-disc list-inside mt-2">
        {entry.steps.map((step, index) => (
          <li key={index} className={entry.completedSteps.includes(index) ? 'line-through' : ''}>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
};
