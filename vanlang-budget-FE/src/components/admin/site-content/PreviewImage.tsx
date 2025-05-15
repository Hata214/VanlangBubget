'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface PreviewImageProps {
  src: string;
  alt?: string;
  className?: string;
  maxHeight?: string;
}

export default function PreviewImage({
  src,
  alt = 'Preview image',
  className = '',
  maxHeight = '200px'
}: PreviewImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = src.split('/').pop() || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-100 border border-gray-300 rounded-md text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Không thể tải hình ảnh</p>
          <p className="text-xs mt-1 text-gray-400 break-all">{src}</p>
        </div>
      ) : (
        <>
          <div 
            className={`relative group overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90' : ''}`}
            style={{ maxHeight: isFullscreen ? 'none' : maxHeight }}
          >
            <img
              src={src}
              alt={alt}
              className={`
                ${isFullscreen ? 'max-h-[90vh] max-w-[90vw] object-contain' : 'w-full h-full object-contain'}
                transition-all duration-300
              `}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: isLoading ? 'none' : 'block' }}
            />
            
            {!isFullscreen && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}
            
            {isFullscreen && (
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={downloadImage}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  title="Tải xuống"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  title="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          
          {!isFullscreen && (
            <div className="mt-1 text-xs text-gray-500 truncate text-center">
              {src.split('/').pop()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
