'use client';

import { forwardRef } from 'react';

interface CameraPreviewProps {
  isActive: boolean;
}

// Hidden video element — source for frame capture
export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  ({ isActive }, ref) => {
    return (
      <video
        ref={ref}
        className="hidden"
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    );
  }
);

CameraPreview.displayName = 'CameraPreview';
