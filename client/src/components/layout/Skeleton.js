import React from 'react';

// Grey placeholder cards shown while a list loads (less jumpy than a full-screen spinner)
export const SkeletonCards = ({ count = 6 }) => (
  <div className='posts-grid' aria-busy='true' aria-live='polite'>
    {Array.from({ length: count }).map((_, i) => (
      <div className='skeleton-card' key={i}>
        <div className='skeleton-block' style={{ height: 150 }} />
        <div className='skeleton-block' style={{ height: 18, width: '70%' }} />
        <div className='skeleton-block' style={{ height: 14, width: '45%' }} />
        <div className='skeleton-block' style={{ height: 36 }} />
      </div>
    ))}
  </div>
);

export const SkeletonRows = ({ count = 3 }) => (
  <div aria-busy='true' aria-live='polite'>
    {Array.from({ length: count }).map((_, i) => (
      <div className='skeleton-card' key={i} style={{ marginBottom: '1rem' }}>
        <div className='skeleton-block' style={{ height: 20, width: '60%' }} />
        <div className='skeleton-block' style={{ height: 14, width: '40%' }} />
        <div className='skeleton-block' style={{ height: 14, width: '80%' }} />
      </div>
    ))}
  </div>
);
