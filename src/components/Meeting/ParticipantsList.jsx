import React from 'react';
import { X, Mic, MicOff, Video, VideoOff, Hand, Crown, UserX } from 'lucide-react';

const ParticipantsList = ({ participants, onClose, onMuteParticipant, onRemoveParticipant, isHost = true }) => {
  const getParticipantStatus = (participant) => {
    const statuses = [];
    if (participant.isMuted) statuses.push('Muted');
    if (participant.isVideoOff) statuses.push('Video Off');
    if (participant.isHandRaised) statuses.push('Hand Raised');
    if (participant.isScreenSharing) statuses.push('Screen Sharing');
    return statuses.join(', ') || 'Active';
  };

  const getStatusColor = (participant) => {
    if (participant.isHandRaised) return 'text-yellow-600';
    if (participant.isMuted && participant.isVideoOff) return 'text-red-600';
    if (participant.isMuted || participant.isVideoOff) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-800">
          Participants ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold relative">
                  {participant.name?.[0]?.toUpperCase() || 'P'}
                  {participant.isHost && (
                    <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>

                {/* Participant Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {participant.name || 'Unknown'}
                    </span>
                    {participant.isHost && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Host
                      </span>
                    )}
                    {participant.id === 'local' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${getStatusColor(participant)}`}>
                    {getParticipantStatus(participant)}
                  </div>
                </div>
              </div>

              {/* Status Icons & Controls */}
              <div className="flex items-center space-x-2">
                {/* Status Icons */}
                <div className="flex items-center space-x-1">
                  {participant.isMuted ? (
                    <MicOff className="w-4 h-4 text-red-500" />
                  ) : (
                    <Mic className="w-4 h-4 text-green-500" />
                  )}
                  
                  {participant.isVideoOff ? (
                    <VideoOff className="w-4 h-4 text-red-500" />
                  ) : (
                    <Video className="w-4 h-4 text-green-500" />
                  )}
                  
                  {participant.isHandRaised && (
                    <Hand className="w-4 h-4 text-yellow-500" />
                  )}
                </div>

                {/* Host Controls */}
                {isHost && participant.id !== 'local' && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onMuteParticipant?.(participant.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title={participant.isMuted ? 'Unmute participant' : 'Mute participant'}
                    >
                      {participant.isMuted ? (
                        <Mic className="w-4 h-4 text-gray-600" />
                      ) : (
                        <MicOff className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => onRemoveParticipant?.(participant.id)}
                      className="p-1 hover:bg-red-100 rounded"
                      title="Remove participant"
                    >
                      <UserX className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Stats */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Active participants:</span>
            <span className="font-medium">
              {participants.filter(p => !p.isMuted || !p.isVideoOff).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Hands raised:</span>
            <span className="font-medium text-yellow-600">
              {participants.filter(p => p.isHandRaised).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Screen sharing:</span>
            <span className="font-medium">
              {participants.filter(p => p.isScreenSharing).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;
