import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ height: '14px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', width: '35%' }}></div>
          <div style={{ height: '24px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '6px', width: '60%' }}></div>
          <div style={{ height: '12px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', width: '45%' }}></div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
