"use client"

import { useEffect, useRef } from 'react';

export default function TestVideoPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      console.log('Video element:', videoRef.current);
      
      const video = videoRef.current;
      
      const handleError = () => {
        console.error('Video Error:', {
          error: video.error,
          readyState: video.readyState,
          networkState: video.networkState,
          currentSrc: video.currentSrc,
          src: video.src,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        });
      };

      video.addEventListener('error', handleError);
      video.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded', {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
        });
      });

      return () => {
        video.removeEventListener('error', handleError);
      };
    }
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Video Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Optimized MP4</h2>
        <video
          ref={videoRef}
          src="/videos/Ambitious_optimized.mp4"
          controls
          className="w-full max-w-2xl"
        >
          Your browser does not support the video tag.
        </video>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Debug Info</h2>
        <p>Check the browser console for detailed error information.</p>
        <button 
          onClick={() => videoRef.current?.play().catch(console.error)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Play Video
        </button>
      </div>
    </div>
  );
}
