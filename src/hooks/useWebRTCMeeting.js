import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import toast from 'react-hot-toast';

export const useWebRTCMeeting = (meetingId) => {
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const { manager: webSocketManager } = useWebSocketContext();

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ]
      },
      // Add TURN servers for production
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password'
      // }
    ]
  };

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Failed to get local media:', error);
      toast.error('Failed to access camera/microphone');
      throw error;
    }
  }, []);

  // Create peer connection
  const createPeer = useCallback((participantId, initiator, stream) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      config: rtcConfig,
      stream
    });

    peer.on('signal', (signal) => {
      // Send signaling data through WebSocket
      webSocketManager?.sendMeetingSignal(meetingId, {
        type: 'webrtc-signal',
        target: participantId,
        signal,
        from: 'local'
      });
    });

    peer.on('stream', (remoteStream) => {
      setPeers(prev => ({
        ...prev,
        [participantId]: {
          ...prev[participantId],
          remoteStream
        }
      }));
      toast.success(`Connected to participant ${participantId}`);
    });

    peer.on('connect', () => {
      console.log(`Connected to peer ${participantId}`);
      setIsConnected(true);
    });

    peer.on('error', (error) => {
      console.error(`Peer connection error for ${participantId}:`, error);
      toast.error(`Connection failed with participant ${participantId}`);
      
      // Remove failed peer
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[participantId];
        return newPeers;
      });
      
      delete peersRef.current[participantId];
    });

    peer.on('close', () => {
      console.log(`Peer connection closed for ${participantId}`);
      
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[participantId];
        return newPeers;
      });
      
      delete peersRef.current[participantId];
    });

    peersRef.current[participantId] = peer;
    setPeers(prev => ({
      ...prev,
      [participantId]: { peer, remoteStream: null }
    }));

    return peer;
  }, [meetingId, webSocketManager]);

  // Handle signaling data from other participants
  const handleSignal = useCallback((data) => {
    const { from, signal, target } = data;
    
    if (target !== 'local') return;

    const peer = peersRef.current[from];
    if (peer) {
      peer.signal(signal);
    } else {
      // Create new peer connection for incoming call
      const stream = localStreamRef.current;
      if (stream) {
        const newPeer = createPeer(from, false, stream);
        newPeer.signal(signal);
      }
    }
  }, [createPeer]);

  // Start the call
  const startCall = useCallback(async () => {
    try {
      const stream = await initializeLocalStream();
      
      // Subscribe to meeting signaling
      webSocketManager?.subscribeToMeetingSignaling(meetingId, {
        onSignal: handleSignal,
        onParticipantJoined: (participant) => {
          // Initiate connection to new participant
          if (stream && participant.id !== 'local') {
            createPeer(participant.id, true, stream);
          }
        },
        onParticipantLeft: (participant) => {
          // Clean up peer connection
          const peer = peersRef.current[participant.id];
          if (peer) {
            peer.destroy();
          }
        }
      });

      setIsInitiator(true);
      
      // Announce joining the meeting
      webSocketManager?.sendMeetingUpdate(meetingId, {
        type: 'participant_joined',
        participant: {
          id: 'local',
          name: JSON.parse(localStorage.getItem('user'))?.firstname || 'Anonymous'
        }
      });

    } catch (error) {
      console.error('Failed to start call:', error);
      throw error;
    }
  }, [meetingId, initializeLocalStream, webSocketManager, handleSignal, createPeer]);

  // End the call
  const endCall = useCallback(() => {
    // Close all peer connections
    Object.values(peersRef.current).forEach(peer => {
      peer.destroy();
    });
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Clean up state
    setPeers({});
    setLocalStream(null);
    setIsConnected(false);
    peersRef.current = {};
    localStreamRef.current = null;

    // Unsubscribe from meeting
    webSocketManager?.unsubscribeFromMeetingSignaling(meetingId);

  }, [meetingId, webSocketManager]);

  // Toggle microphone
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Return muted state
      }
    }
    return false;
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled; // Return video off state
      }
    }
    return false;
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in all peer connections
      Object.values(peersRef.current).forEach(peer => {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peer._pc?.getSenders()?.find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Listen for screen share end
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

      return screenStream;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      // Replace screen share track back to camera
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer._pc?.getSenders()?.find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    peers,
    localStream,
    isConnected,
    isInitiator,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    createPeer
  };
};
