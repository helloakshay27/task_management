import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Users, Video, Play, 
  Edit, Trash2, Copy, Settings, MoreVertical 
} from 'lucide-react';
import MeetingScheduler from './MeetingScheduler';
import toast from 'react-hot-toast';

const MeetingsList = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, ongoing
  const [sortBy, setSortBy] = useState('date'); // date, title, participants

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = () => {
    // Load meetings from localStorage (replace with API call)
    const storedMeetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
    setMeetings(storedMeetings);
  };

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
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeDisplay = (meeting) => {
    const scheduledTime = new Date(meeting.scheduledTime);
    const now = new Date();
    const diffMs = scheduledTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      // Past meeting
      return scheduledTime.toLocaleDateString() + ' at ' + scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffMins < 60) {
      // Less than 1 hour
      return `in ${diffMins} minutes`;
    } else if (diffHours < 24) {
      // Less than 1 day
      return `in ${diffHours} hours`;
    } else {
      // More than 1 day
      return `in ${diffDays} days`;
    }
  };

  const filteredMeetings = meetings
    .filter(meeting => {
      if (filter === 'all') return true;
      return getMeetingStatus(meeting) === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'participants':
          return b.participants.length - a.participants.length;
        default: // date
          return new Date(a.scheduledTime) - new Date(b.scheduledTime);
      }
    });

  const joinMeeting = (meetingId) => {
    navigate(`/meeting/${meetingId}`);
  };

  const copyMeetingUrl = (meetingUrl) => {
    navigator.clipboard.writeText(meetingUrl);
    toast.success('Meeting URL copied to clipboard!');
  };

  const deleteMeeting = (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      const updatedMeetings = meetings.filter(m => m.id !== meetingId);
      setMeetings(updatedMeetings);
      localStorage.setItem('scheduledMeetings', JSON.stringify(updatedMeetings));
      toast.success('Meeting deleted successfully');
    }
  };

  const editMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setShowScheduler(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Manage your video meetings</p>
        </div>
        <button
          onClick={() => setShowScheduler(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Video className="w-4 h-4" />
          <span>New Meeting</span>
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Meetings</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="past">Past</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="participants">Participants</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
          <p className="text-gray-600 mb-4">Get started by scheduling your first meeting</p>
          <button
            onClick={() => setShowScheduler(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Schedule Meeting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeetings.map((meeting) => {
            const status = getMeetingStatus(meeting);
            
            return (
              <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {meeting.title}
                      </h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="ml-4 relative">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3">
                  {/* Time */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{getTimeDisplay(meeting)}</span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{meeting.duration} minutes</span>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Description */}
                  {meeting.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}

                  {/* Meeting Settings */}
                  {(meeting.settings?.requirePassword || meeting.settings?.isPrivate) && (
                    <div className="flex items-center space-x-2">
                      {meeting.settings.requirePassword && (
                        <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          Password Protected
                        </span>
                      )}
                      {meeting.settings.isPrivate && (
                        <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          Private
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    {status === 'upcoming' || status === 'ongoing' ? (
                      <button
                        onClick={() => joinMeeting(meeting.id)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex-1 justify-center"
                      >
                        <Play className="w-4 h-4" />
                        <span>{status === 'ongoing' ? 'Join' : 'Start'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => joinMeeting(meeting.id)}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex-1 justify-center"
                      >
                        <Video className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    )}

                    <button
                      onClick={() => copyMeetingUrl(meeting.meetingUrl)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                      title="Copy meeting URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editMeeting(meeting)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                      title="Edit meeting"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteMeeting(meeting.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg"
                      title="Delete meeting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meeting Scheduler Modal */}
      <MeetingScheduler
        isOpen={showScheduler}
        onClose={() => {
          setShowScheduler(false);
          setEditingMeeting(null);
          loadMeetings(); // Refresh meetings list
        }}
        editingMeeting={editingMeeting}
      />
    </div>
  );
};

export default MeetingsList;
