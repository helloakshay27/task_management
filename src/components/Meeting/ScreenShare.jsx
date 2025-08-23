import React, { useRef, useEffect, useState } from 'react';
import { Monitor, StopCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ScreenShare = ({ onScreenShare, onStopScreenShare, isSharing }) => {
  const [screenStream, setScreenStream] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const screenVideoRef = useRef(null);

  useEffect(() => {
    // Check if screen sharing is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setIsSupported(false);
    }
  }, []);

  const startScreenShare = async () => {
    if (!isSupported) {
      toast.error('Screen sharing is not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setScreenStream(stream);
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      // Listen for the user stopping screen share via browser controls
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
        toast.info('Screen sharing stopped');
      });

      // Call the callback to notify parent component
      onScreenShare?.(stream);
      toast.success('Screen sharing started');

    } catch (error) {
      console.error('Error starting screen share:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission denied');
      } else if (error.name === 'NotFoundError') {
        toast.error('No screen source selected');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Screen sharing not supported');
      } else {
        toast.error('Failed to start screen sharing');
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
      });
      setScreenStream(null);
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      
      // Call the callback to notify parent component
      onStopScreenShare?.();
      toast.success('Screen sharing stopped');
    }
  };

  const handleToggleScreenShare = () => {
    if (isSharing || screenStream) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Screen sharing not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggleScreenShare}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isSharing || screenStream
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-500 text-white hover:bg-gray-600'
        }`}
        title={isSharing || screenStream ? 'Stop screen sharing' : 'Start screen sharing'}
      >
        {isSharing || screenStream ? (
          <>
            <StopCircle className="w-4 h-4" />
            <span>Stop Sharing</span>
          </>
        ) : (
          <>
            <Monitor className="w-4 h-4" />
            <span>Share Screen</span>
          </>
        )}
      </button>

      {/* Screen preview (hidden, used for stream management) */}
      <video
        ref={screenVideoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />
    </div>
  );
};

export default ScreenShare;
