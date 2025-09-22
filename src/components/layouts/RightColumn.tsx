import React from 'react';
import CompactDailySnapshot from '../molecules/CompactDailySnapshot.tsx';

const RightColumn: React.FC = () => {
  return (
    <div className="space-y-6">
      <CompactDailySnapshot />
    </div>
  );
};

export default RightColumn;
