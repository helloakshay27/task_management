import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, Clock, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import MeetingScheduler from '../../components/Meeting/MeetingScheduler';
import MeetingButton from '../../components/Meeting/MeetingButton';
import toast from 'react-hot-toast';

const MeetingsPage = () => {
  const navigate = useNavigate();
  const [showScheduler, setShowScheduler] = useState(false);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    loadMeetings();
    initializeDemoMeetings();
  }, []);

  const loadMeetings = () => {
    const storedMeetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
    setMeetings(storedMeetings);
  };

  const initializeDemoMeetings = () => {
    const existingMeetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
    
    if (existingMeetings.length === 0) {
      // Create some demo meetings
      const demoMeetings = [
        {
          id: uuidv4().slice(0, 10).toUpperCase(),
          title: 'Project Kickoff Meeting',
          description: 'Initial project discussion and planning session',
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          duration: 60,
          participants: [
            { value: 1, label: 'John Doe' },
            { value: 2, label: 'Jane Smith' }
          ],
          hostId: JSON.parse(localStorage.getItem('user'))?.id || 1,
          hostName: JSON.parse(localStorage.getItem('user'))?.firstname || 'Host',
          meetingUrl: '',
          settings: {
            isPrivate: false,
            requirePassword: false,
            password: null,
            enableWaitingRoom: true,
            allowRecording: true,
            muteOnJoin: false
          },
          status: 'scheduled',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4().slice(0, 10).toUpperCase(),
          title: 'Daily Standup',
          description: 'Quick daily sync meeting',
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 15,
          participants: [
            { value: 1, label: 'Team Lead' },
            { value: 2, label: 'Developer 1' },
            { value: 3, label: 'Developer 2' }
          ],
          hostId: JSON.parse(localStorage.getItem('user'))?.id || 1,
          hostName: JSON.parse(localStorage.getItem('user'))?.firstname || 'Host',
          meetingUrl: '',
          settings: {
            isPrivate: false,
            requirePassword: false,
            password: null,
            enableWaitingRoom: false,
            allowRecording: false,
            muteOnJoin: true
          },
          isRecurring: true,
          recurrenceType: 'daily',
          status: 'scheduled',
          createdAt: new Date().toISOString()
        }
      ];

      demoMeetings.forEach(meeting => {
        meeting.meetingUrl = `${window.location.origin}/meeting/${meeting.id}`;
      });

      localStorage.setItem('scheduledMeetings', JSON.stringify(demoMeetings));
      setMeetings(demoMeetings);
    }
  };

  const startInstantMeeting = () => {
    const meetingId = uuidv4().slice(0, 10).toUpperCase();
    navigate(`/meeting/${meetingId}`);
  };

  const joinDemoMeeting = () => {
    const demoMeetingId = 'DEMO-' + Date.now().toString(36).toUpperCase();
    navigate(`/meeting/${demoMeetingId}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Meetings</h1>
        <p className="text-gray-600">
          Collaborate with your team through high-quality video meetings with screen sharing, 
          real-time chat, and file sharing capabilities.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Video className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-900">Start Instant Meeting</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Start a meeting right now and invite participants with a shareable link.
          </p>
          <button
            onClick={startInstantMeeting}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Meeting
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-900">Schedule Meeting</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Schedule a meeting for later and send invitations to participants.
          </p>
          <button
            onClick={() => setShowScheduler(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Schedule Meeting
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-900">Join Demo Meeting</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Try out the meeting features in a demo environment.
          </p>
          <button
            onClick={joinDemoMeeting}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Join Demo
          </button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-gray-50 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Meeting Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-4 bg-white rounded-lg shadow-sm mb-3">
              <Video className="w-8 h-8 text-blue-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">HD Video & Audio</h3>
            <p className="text-sm text-gray-600">Crystal clear video calls with noise cancellation</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-white rounded-lg shadow-sm mb-3">
              <Users className="w-8 h-8 text-green-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Multiple Participants</h3>
            <p className="text-sm text-gray-600">Support for multiple participants in one meeting</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-white rounded-lg shadow-sm mb-3">
              <div className="w-8 h-8 bg-purple-600 rounded mx-auto flex items-center justify-center">
                <span className="text-white text-xs font-bold">📺</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Screen Sharing</h3>
            <p className="text-sm text-gray-600">Share your screen for presentations and demos</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-white rounded-lg shadow-sm mb-3">
              <div className="w-8 h-8 bg-orange-600 rounded mx-auto flex items-center justify-center">
                <span className="text-white text-xs font-bold">💬</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time Chat</h3>
            <p className="text-sm text-gray-600">Chat with participants during meetings</p>
          </div>
        </div>
      </div>

      {/* Recent/Upcoming Meetings */}
      {meetings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Meetings</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {meetings.slice(0, 5).map((meeting) => {
                const scheduledTime = new Date(meeting.scheduledTime);
                const isUpcoming = scheduledTime > new Date();
                
                return (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${isUpcoming ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <Video className={`w-5 h-5 ${isUpcoming ? 'text-blue-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{scheduledTime.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{meeting.participants.length} participants</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/meeting/${meeting.id}`)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        isUpcoming
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {isUpcoming ? 'Join' : 'View'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {meetings.length > 5 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  View all meetings ({meetings.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meeting Scheduler Modal */}
      <MeetingScheduler
        isOpen={showScheduler}
        onClose={() => {
          setShowScheduler(false);
          loadMeetings();
        }}
      />
    </div>
  );
};

export default MeetingsPage;
