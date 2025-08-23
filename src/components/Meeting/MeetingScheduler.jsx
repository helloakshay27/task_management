import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Calendar, Clock, Users, Video, Copy, 
  Settings, Eye, EyeOff, X 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import SelectBox from '../SelectBox';
import MultiSelectBox from '../MultiSelectBox';
import { fetchUsers } from '../../redux/slices/userSlice';
import { fetchActiveProjectTypes } from '../../redux/slices/projectSlice';
import toast from 'react-hot-toast';

const MeetingScheduler = ({ isOpen, onClose, projectId = null, taskId = null }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const { fetchUsers: users = [] } = useSelector(state => state.fetchUsers);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: '30',
    isRecurring: false,
    recurrenceType: 'weekly',
    participants: [],
    isPrivate: false,
    requirePassword: false,
    password: '',
    enableWaitingRoom: true,
    allowRecording: true,
    muteOnJoin: false
  });

  const [meetingId, setMeetingId] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUsers({ token }));
      
      // Generate unique meeting ID
      const newMeetingId = uuidv4().slice(0, 10).toUpperCase();
      setMeetingId(newMeetingId);
      setMeetingUrl(`${window.location.origin}/meeting/${newMeetingId}`);
    }
  }, [isOpen, dispatch, token]);

  const durationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
    { value: '180', label: '3 hours' },
    { value: 'custom', label: 'Custom' }
  ];

  const recurrenceOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const userOptions = users.map(user => ({
    value: user.id,
    label: `${user.firstname} ${user.lastname}`,
    email: user.email
  }));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScheduleMeeting = async () => {
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Meeting title is required');
        return;
      }

      if (!formData.scheduledTime) {
        toast.error('Meeting time is required');
        return;
      }

      // Create meeting data
      const meetingData = {
        id: meetingId,
        title: formData.title,
        description: formData.description,
        scheduledTime: formData.scheduledTime,
        duration: parseInt(formData.duration),
        participants: formData.participants,
        hostId: JSON.parse(localStorage.getItem('user'))?.id,
        hostName: JSON.parse(localStorage.getItem('user'))?.firstname || 'Host',
        meetingUrl,
        settings: {
          isPrivate: formData.isPrivate,
          requirePassword: formData.requirePassword,
          password: formData.requirePassword ? formData.password : null,
          enableWaitingRoom: formData.enableWaitingRoom,
          allowRecording: formData.allowRecording,
          muteOnJoin: formData.muteOnJoin
        },
        projectId,
        taskId,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };

      // TODO: Send meeting data to backend
      // await dispatch(createMeeting({ token, payload: meetingData }));

      // For now, store in localStorage (you should replace this with API call)
      const existingMeetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
      existingMeetings.push(meetingData);
      localStorage.setItem('scheduledMeetings', JSON.stringify(existingMeetings));

      toast.success('Meeting scheduled successfully!');
      
      // Send invitations to participants
      if (formData.participants.length > 0) {
        // TODO: Send email invitations
        toast.success(`Invitations sent to ${formData.participants.length} participants`);
      }

      onClose();
      
      // Optionally start the meeting immediately
      if (new Date(formData.scheduledTime) <= new Date()) {
        const startNow = window.confirm('Meeting time is now or in the past. Start meeting immediately?');
        if (startNow) {
          navigate(`/meeting/${meetingId}`);
        }
      }

    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast.error('Failed to schedule meeting. Please try again.');
    }
  };

  const handleStartInstantMeeting = () => {
    // Generate meeting ID and start immediately
    navigate(`/meeting/${meetingId}`);
  };

  const copyMeetingUrl = () => {
    navigator.clipboard.writeText(meetingUrl);
    toast.success('Meeting URL copied to clipboard!');
  };

  const generatePassword = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormData(prev => ({ ...prev, password }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Schedule Meeting</h2>
            <p className="text-sm text-gray-600">Create a new video meeting</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meeting Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Video className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Meeting Details</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Meeting ID:</strong> {meetingId}</p>
              <div className="flex items-center space-x-2">
                <p><strong>Meeting URL:</strong> {meetingUrl}</p>
                <button
                  onClick={copyMeetingUrl}
                  className="p-1 hover:bg-blue-200 rounded"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter meeting title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter meeting description or agenda"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Scheduled Time *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Duration
              </label>
              <SelectBox
                value={formData.duration}
                onChange={(value) => handleInputChange('duration', value)}
                options={durationOptions}
                placeholder="Select duration"
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Participants
            </label>
            <MultiSelectBox
              value={formData.participants}
              onChange={(value) => handleInputChange('participants', value)}
              options={userOptions}
              placeholder="Select participants"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Invitations will be sent to selected participants
            </p>
          </div>

          {/* Recurrence */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Recurring Meeting</span>
            </label>
            
            {formData.isRecurring && (
              <div className="mt-3">
                <SelectBox
                  value={formData.recurrenceType}
                  onChange={(value) => handleInputChange('recurrenceType', value)}
                  options={recurrenceOptions}
                  placeholder="Select recurrence"
                  className="max-w-xs"
                />
              </div>
            )}
          </div>

          {/* Meeting Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Meeting Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Private Meeting</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requirePassword}
                    onChange={(e) => handleInputChange('requirePassword', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Require Password</span>
                </label>

                {formData.requirePassword && (
                  <div className="ml-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter password"
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                )}

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enableWaitingRoom}
                    onChange={(e) => handleInputChange('enableWaitingRoom', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Enable Waiting Room</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.allowRecording}
                    onChange={(e) => handleInputChange('allowRecording', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Allow Recording</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.muteOnJoin}
                    onChange={(e) => handleInputChange('muteOnJoin', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Mute Participants on Join</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleStartInstantMeeting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Start Now
            </button>
            <button
              onClick={handleScheduleMeeting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingScheduler;
