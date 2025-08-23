import React, { useState } from 'react';
import { Video, Calendar, Users, Plus } from 'lucide-react';
import MeetingScheduler from './MeetingScheduler';

const MeetingButton = ({ 
  projectId = null, 
  taskId = null, 
  variant = 'default', // default, small, icon-only
  className = '',
  showScheduler: showSchedulerProp = false,
  onMeetingScheduled
}) => {
  const [showScheduler, setShowScheduler] = useState(showSchedulerProp);

  const handleOpenScheduler = () => {
    setShowScheduler(true);
  };

  const handleCloseScheduler = () => {
    setShowScheduler(false);
    onMeetingScheduled?.();
  };

  const getButtonContent = () => {
    switch (variant) {
      case 'small':
        return (
          <div className="flex items-center space-x-1">
            <Video className="w-3 h-3" />
            <span className="text-xs">Meet</span>
          </div>
        );
      case 'icon-only':
        return <Video className="w-4 h-4" />;
      default:
        return (
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4" />
            <span>Start Meeting</span>
          </div>
        );
    }
  };

  const getButtonClass = () => {
    const baseClass = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
    
    switch (variant) {
      case 'small':
        return `${baseClass} px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 ${className}`;
      case 'icon-only':
        return `${baseClass} p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 ${className}`;
      default:
        return `${baseClass} px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 ${className}`;
    }
  };

  return (
    <>
      <button
        onClick={handleOpenScheduler}
        className={getButtonClass()}
        title={variant === 'icon-only' ? 'Schedule/Start Meeting' : undefined}
      >
        {getButtonContent()}
      </button>

      <MeetingScheduler
        isOpen={showScheduler}
        onClose={handleCloseScheduler}
        projectId={projectId}
        taskId={taskId}
      />
    </>
  );
};

// Component for displaying scheduled meetings for a project/task
export const MeetingsList = ({ projectId = null, taskId = null, limit = 3 }) => {
  const [meetings, setMeetings] = useState([]);

  React.useEffect(() => {
    // Load meetings related to this project/task
    const loadMeetings = () => {
      const allMeetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
      const filteredMeetings = allMeetings
        .filter(meeting => {
          if (projectId && meeting.projectId === projectId) return true;
          if (taskId && meeting.taskId === taskId) return true;
          return false;
        })
        .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
        .slice(0, limit);
      
      setMeetings(filteredMeetings);
    };

    loadMeetings();
  }, [projectId, taskId, limit]);

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const scheduledTime = new Date(meeting.scheduledTime);
    const endTime = new Date(scheduledTime.getTime() + meeting.duration * 60000);

    if (now >= scheduledTime && now <= endTime) {
      return 'ongoing';
    } else if (now < scheduledTime) {
      return 'upcoming';
    } else {
      return 'past';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing':
        return 'text-green-600';
      case 'upcoming':
        return 'text-blue-600';
      case 'past':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="text-center py-4">
        <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No meetings scheduled</p>
        <MeetingButton 
          projectId={projectId} 
          taskId={taskId}
          variant="small"
          className="mt-2"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-800">Meetings</h4>
        <MeetingButton 
          projectId={projectId} 
          taskId={taskId}
          variant="icon-only"
        />
      </div>
      
      <div className="space-y-2">
        {meetings.map((meeting) => {
          const status = getMeetingStatus(meeting);
          
          return (
            <div key={meeting.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                status === 'ongoing' ? 'bg-green-500' : 
                status === 'upcoming' ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {meeting.title}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(meeting.scheduledTime).toLocaleDateString()}</span>
                  <Users className="w-3 h-3 ml-2" />
                  <span>{meeting.participants.length}</span>
                </div>
              </div>
              
              <button
                onClick={() => window.open(`/meeting/${meeting.id}`, '_blank')}
                className={`p-1 rounded hover:bg-gray-200 ${getStatusColor(status)}`}
                title={status === 'ongoing' ? 'Join meeting' : 'View meeting'}
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeetingButton;
