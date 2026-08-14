import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 space-y-3"
        >
          <div className="h-4 bg-slate-700/60 rounded-md w-1/3"></div>
          <div className="h-8 bg-slate-700/40 rounded-md w-2/3"></div>
          <div className="h-3 bg-slate-700/30 rounded-md w-1/2"></div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
