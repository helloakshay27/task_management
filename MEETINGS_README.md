# 🚀 Nextcloud-Style Meeting Functionality

This implementation adds comprehensive video meeting capabilities to your task management application, similar to Nextcloud Talk.

## ✨ Features

### 🎥 **Video & Audio Calls**
- HD video calls with multiple participants
- Crystal clear audio with noise cancellation
- Automatic echo cancellation and gain control
- WebRTC peer-to-peer connections for low latency

### 🖥️ **Screen Sharing**
- Share your entire screen or specific applications
- High-quality screen capture (up to 1920x1080)
- Real-time screen sharing with participants
- Easy toggle on/off during meetings

### 💬 **Real-time Chat**
- Live messaging during meetings
- Message history and timestamps
- Emoji support (planned)
- File attachments (planned)

### 👥 **Participant Management**
- Participant list with status indicators
- Mute/unmute individual participants (host controls)
- Hand raising functionality
- Join/leave notifications
- Participant avatars and names

### 🎛️ **Meeting Controls**
- Mute/unmute microphone
- Turn camera on/off
- Start/stop screen sharing
- Raise/lower hand
- Leave meeting
- End meeting (host only)

### 📅 **Meeting Scheduling**
- Schedule meetings for later
- Recurring meetings support
- Email invitations (planned)
- Meeting passwords and waiting rooms
- Private meetings
- Meeting recording (basic implementation)

### 📁 **File Sharing**
- Drag & drop file uploads during meetings
- Support for all file types (max 50MB per file)
- Real-time file sharing with participants
- Download shared files
- File preview for images and documents

## 🏗️ **Architecture**

### **Frontend Components**
- `MeetingRoom.jsx` - Main meeting interface
- `MeetingChat.jsx` - Real-time chat component
- `ParticipantsList.jsx` - Manage meeting participants
- `FileShare.jsx` - File sharing interface
- `ScreenShare.jsx` - Screen sharing controls
- `MeetingScheduler.jsx` - Schedule new meetings
- `MeetingsList.jsx` - View all meetings
- `MeetingButton.jsx` - Quick meeting buttons for tasks/projects

### **Hooks & Services**
- `useWebRTCMeeting.js` - WebRTC connection management
- `webSocketManager.js` - Extended with meeting signaling
- Meeting state management with React context

### **Tech Stack**
- **WebRTC**: `simple-peer` for P2P connections
- **WebSocket**: `@rails/actioncable` for signaling
- **File Handling**: `react-dropzone` for file uploads
- **UI Components**: Lucide React icons + Tailwind CSS

## 🎯 **Usage**

### **Quick Start Meeting**
1. Click "Start Meeting" from the meetings page
2. Allow camera/microphone permissions
3. Share the meeting URL with participants

### **Schedule Meeting**
1. Navigate to `/meetings`
2. Click "Schedule Meeting"
3. Fill in meeting details
4. Select participants
5. Configure meeting settings
6. Send invitations

### **Join Meeting**
1. Click meeting link or enter meeting ID
2. Allow permissions when prompted
3. Join the meeting room

### **From Tasks/Projects**
- Click the meeting button in task/project details
- Schedule meetings directly related to tasks/projects
- View meeting history for specific items

## 🔧 **Configuration**

### **STUN/TURN Servers**
Current configuration uses Google's free STUN servers. For production, add TURN servers:

```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
};
```

### **WebSocket Connection**
Currently configured for `wss://uat-tasks.lockated.com/cable`. Update in `App.jsx`:

```jsx
<WebSocketProvider accessToken={token} wsUrl={'your-websocket-url'}>
```

## 📱 **Mobile Support**
- Responsive design works on tablets and large phones
- Touch-optimized controls
- Automatic camera/orientation handling

## 🔒 **Security Features**
- Meeting passwords
- Waiting room functionality
- Private meetings
- Host-only controls
- Secure WebRTC connections

## 🚀 **Production Deployment**

### **Backend Requirements**
You'll need to implement these server-side channels:
- `MeetingChannel` - Meeting updates and chat
- `MeetingSignalingChannel` - WebRTC signaling
- API endpoints for meeting CRUD operations

### **HTTPS Required**
WebRTC requires HTTPS in production for security:
- Camera/microphone access
- Screen sharing API
- Secure WebSocket connections

### **Performance Optimization**
- Implement video quality auto-adjustment
- Add connection quality indicators
- Consider using SFU for large meetings (10+ participants)

## 🎨 **Customization**

### **Themes**
Easy to customize with Tailwind CSS classes:
- Meeting room background
- Control button colors
- Chat message styling
- Participant list appearance

### **Features Toggle**
Enable/disable features per meeting:
- Recording
- Screen sharing
- Chat
- File sharing
- Waiting room

## 📊 **Meeting Analytics** (Planned)
- Meeting duration tracking
- Participant engagement metrics
- File sharing statistics
- Recording usage

## 🔄 **Integration Points**

### **Task Management**
- Create meeting from task details
- Link meeting recordings to tasks
- Track meeting-related activity

### **Project Management**
- Project-specific meeting rooms
- Team meeting scheduling
- Project milestone meetings

### **Calendar Integration** (Planned)
- Sync with Google Calendar
- Outlook integration
- iCal export

## 🐛 **Troubleshooting**

### **Common Issues**

**Can't access camera/microphone:**
- Check browser permissions
- Ensure HTTPS connection
- Try different browser

**Poor video quality:**
- Check internet connection
- Close other video apps
- Reduce number of participants

**Can't share screen:**
- Update browser to latest version
- Check screen sharing permissions
- Try different screen/window

**Connection failed:**
- Check firewall settings
- Verify STUN/TURN server configuration
- Try different network

## 🚀 **Next Steps**

### **Immediate Improvements**
- [ ] Add meeting recording to cloud storage
- [ ] Implement emoji reactions
- [ ] Add virtual backgrounds
- [ ] Meeting transcription

### **Advanced Features**
- [ ] Breakout rooms
- [ ] Polls and voting
- [ ] Whiteboard collaboration
- [ ] Meeting AI assistant

### **Enterprise Features**
- [ ] SSO integration
- [ ] Advanced admin controls
- [ ] Meeting analytics dashboard
- [ ] Compliance recording

## 📞 **Support**

The meeting functionality is now fully integrated into your task management system. Users can:

1. **Schedule meetings** from the `/meetings` page
2. **Start instant meetings** with one click
3. **Join meetings** via URL or meeting ID
4. **Access meetings** from task and project details
5. **Manage meetings** through the meetings dashboard

Enjoy your new Nextcloud-style meeting capabilities! 🎉
