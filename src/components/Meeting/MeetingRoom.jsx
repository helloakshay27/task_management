import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, 
  MessageSquare, Users, Settings, MoreHorizontal,
  Hand, Share2, Upload
} from 'lucide-react';
import { useWebRTCMeeting } from '../../hooks/useWebRTCMeeting';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import MeetingChat from './MeetingChat';
import ParticipantsList from './ParticipantsList';
import ScreenShare from './ScreenShare';
import FileShare from './FileShare';
import toast from 'react-hot-toast';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const fileInputRef = useRef(null);

  // UI State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showFileShare, setShowFileShare] = useState(false);

  // Meeting State
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // WebRTC Hook
  const {
    peers,
    localStream: rtcLocalStream,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isConnected
  } = useWebRTCMeeting(meetingId);

  // WebSocket Context
  const { manager: webSocketManager } = useWebSocketContext();

  // Initialize media and join meeting
  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Start WebRTC connection
        await startCall();

        // Subscribe to meeting updates via WebSocket
        if (webSocketManager) {
          webSocketManager.subscribeToMeeting(meetingId, {
            onParticipantJoined: (participant) => {
              setParticipants(prev => [...prev, participant]);
              toast.success(`${participant.name} joined the meeting`);
            },
            onParticipantLeft: (participant) => {
              setParticipants(prev => prev.filter(p => p.id !== participant.id));
              toast.success(`${participant.name} left the meeting`);
            },
            onMessage: (message) => {
              setMessages(prev => [...prev, message]);
            },
            onHandRaised: (participant) => {
              toast.success(`${participant.name} raised their hand`);
            },
            onScreenShare: (participant, isSharing) => {
              if (isSharing) {
                toast.success(`${participant.name} started screen sharing`);
              } else {
                toast.success(`${participant.name} stopped screen sharing`);
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize meeting:', error);
        toast.error('Failed to access camera/microphone. Please check permissions.');
      }
    };

    if (meetingId) {
      initializeMeeting();
    }

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (webSocketManager) {
        webSocketManager.unsubscribeFromMeeting(meetingId);
      }
    };
  }, [meetingId]);

  // Update remote video streams
  useEffect(() => {
    Object.entries(peers).forEach(([peerId, peer]) => {
      const remoteVideo = remoteVideosRef.current[peerId];
      if (remoteVideo && peer.remoteStream) {
        remoteVideo.srcObject = peer.remoteStream;
      }
    });
  }, [peers]);

  // Meeting Controls
  const handleMuteToggle = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    toggleMute();
    
    // Notify other participants
    webSocketManager?.sendMeetingUpdate(meetingId, {
      type: 'mute_toggle',
      isMuted: newMutedState
    });
  }, [isMuted, toggleMute, webSocketManager, meetingId]);

  const handleVideoToggle = useCallback(() => {
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);
    toggleVideo();
    
    // Notify other participants
    webSocketManager?.sendMeetingUpdate(meetingId, {
      type: 'video_toggle',
      isVideoOff: newVideoState
    });
  }, [isVideoOff, toggleVideo, webSocketManager, meetingId]);

  const handleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await startScreenShare();
        setIsScreenSharing(true);
      }
      
      // Notify other participants
      webSocketManager?.sendMeetingUpdate(meetingId, {
        type: 'screen_share',
        isSharing: !isScreenSharing
      });
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Failed to share screen');
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare, webSocketManager, meetingId]);

  const handleEndCall = useCallback(() => {
    endCall();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Notify other participants
    webSocketManager?.sendMeetingUpdate(meetingId, {
      type: 'participant_left'
    });
    
    navigate(-1);
  }, [endCall, localStream, navigate, webSocketManager, meetingId]);

  const handleRaiseHand = useCallback(() => {
    const newHandState = !isHandRaised;
    setIsHandRaised(newHandState);
    
    // Notify other participants
    webSocketManager?.sendMeetingUpdate(meetingId, {
      type: 'hand_raised',
      isRaised: newHandState
    });
    
    toast.success(newHandState ? 'Hand raised' : 'Hand lowered');
  }, [isHandRaised, webSocketManager, meetingId]);

  const handleFileUpload = (files) => {
    // Handle file sharing
    Array.from(files).forEach(file => {
      // Send file to other participants via WebSocket or upload to server
      webSocketManager?.sendMeetingUpdate(meetingId, {
        type: 'file_share',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    });
    toast.success(`Shared ${files.length} file(s)`);
  };

  const sendMessage = (message) => {
    const messageData = {
      id: Date.now(),
      text: message,
      sender: JSON.parse(localStorage.getItem('user'))?.firstname || 'Anonymous',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, messageData]);
    
    // Send via WebSocket
    webSocketManager?.sendMeetingUpdate(meetingId, {
      type: 'chat_message',
      message: messageData
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Meeting Room</h1>
          <span className="text-sm text-gray-300">Meeting ID: {meetingId}</span>
          {isRecording && (
            <div className="flex items-center space-x-2 bg-red-600 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm">Recording</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 hover:bg-gray-700 rounded-full"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className="flex-1 relative bg-black">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-4 h-full">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="flex items-center justify-center w-full h-full bg-gray-700">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                    {JSON.parse(localStorage.getItem('user'))?.firstname?.[0] || 'U'}
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isMuted && <MicOff className="inline w-4 h-4 ml-1" />}
                {isHandRaised && <Hand className="inline w-4 h-4 ml-1 text-yellow-400" />}
              </div>
              {isScreenSharing && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                  Sharing
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {Object.entries(peers).map(([peerId, peer]) => (
              <div key={peerId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={el => remoteVideosRef.current[peerId] = el}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  Participant {peerId}
                </div>
              </div>
            ))}

            {/* Placeholder for additional participants */}
            {participants.slice(Object.keys(peers).length).map((participant, index) => (
              <div key={`placeholder-${index}`} className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                  {participant.name?.[0] || 'P'}
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.name || `Participant ${index + 1}`}
                </div>
              </div>
            ))}
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded">
              Connecting...
            </div>
          )}
        </div>

        {/* Side Panel */}
        {(showChat || showParticipants || showFileShare) && (
          <div className="w-80 bg-white border-l">
            {showChat && (
              <MeetingChat
                messages={messages}
                onSendMessage={sendMessage}
                onClose={() => setShowChat(false)}
              />
            )}
            {showParticipants && (
              <ParticipantsList
                participants={[
                  { id: 'local', name: 'You (Host)', isMuted, isVideoOff, isHandRaised },
                  ...participants
                ]}
                onClose={() => setShowParticipants(false)}
              />
            )}
            {showFileShare && (
              <FileShare
                onFileUpload={handleFileUpload}
                onClose={() => setShowFileShare(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute/Unmute */}
          <button
            onClick={handleMuteToggle}
            className={`p-3 rounded-full ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Video On/Off */}
          <button
            onClick={handleVideoToggle}
            className={`p-3 rounded-full ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={handleScreenShare}
            className={`p-3 rounded-full ${
              isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <Monitor className="w-6 h-6" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={handleRaiseHand}
            className={`p-3 rounded-full ${
              isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <Hand className="w-6 h-6" />
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full ${
              showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-6 h-6" />
          </button>

          {/* File Share */}
          <button
            onClick={() => setShowFileShare(!showFileShare)}
            className="p-3 rounded-full bg-gray-600 hover:bg-gray-700"
          >
            <Share2 className="w-6 h-6" />
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 ml-8"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
    </div>
  );
};

export default MeetingRoom;
