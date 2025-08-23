#!/usr/bin/env node

/**
 * Setup script for Meeting functionality
 * Adds demo meetings and initializes meeting data
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEMO_MEETINGS_FILE = 'public/demo-meetings.json';
const README_FILE = 'MEETINGS_SETUP.md';

// Demo meetings data
const demoMeetings = [
  {
    id: 'DEMO-001',
    title: 'Team Standup Meeting',
    description: 'Daily team synchronization meeting',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    participants: [
      { value: 1, label: 'John Doe', email: 'john@example.com' },
      { value: 2, label: 'Jane Smith', email: 'jane@example.com' },
      { value: 3, label: 'Mike Johnson', email: 'mike@example.com' }
    ],
    hostId: 1,
    hostName: 'Team Lead',
    settings: {
      isPrivate: false,
      requirePassword: false,
      enableWaitingRoom: false,
      allowRecording: true,
      muteOnJoin: true
    },
    isRecurring: true,
    recurrenceType: 'daily',
    status: 'scheduled'
  },
  {
    id: 'DEMO-002',
    title: 'Project Review Meeting',
    description: 'Weekly project progress review and planning',
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    participants: [
      { value: 1, label: 'Project Manager', email: 'pm@example.com' },
      { value: 2, label: 'Tech Lead', email: 'tech@example.com' },
      { value: 3, label: 'Designer', email: 'design@example.com' },
      { value: 4, label: 'QA Lead', email: 'qa@example.com' }
    ],
    hostId: 1,
    hostName: 'Project Manager',
    settings: {
      isPrivate: false,
      requirePassword: true,
      password: 'project123',
      enableWaitingRoom: true,
      allowRecording: true,
      muteOnJoin: false
    },
    isRecurring: true,
    recurrenceType: 'weekly',
    status: 'scheduled'
  },
  {
    id: 'DEMO-003',
    title: 'Client Presentation',
    description: 'Product demo and feedback session with client',
    scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    participants: [
      { value: 1, label: 'Sales Rep', email: 'sales@example.com' },
      { value: 2, label: 'Product Manager', email: 'product@example.com' },
      { value: 3, label: 'Client Contact', email: 'client@company.com' }
    ],
    hostId: 1,
    hostName: 'Sales Rep',
    settings: {
      isPrivate: true,
      requirePassword: true,
      password: 'client2024',
      enableWaitingRoom: true,
      allowRecording: true,
      muteOnJoin: false
    },
    isRecurring: false,
    status: 'scheduled'
  }
];

// Setup instructions
const setupInstructions = `# 🎬 Meeting Functionality Setup

## 🚀 Quick Start

Your meeting functionality is now ready! Here's how to get started:

### 1. **Demo Meetings Available**
We've created 3 demo meetings for you to test:

1. **Team Standup** (in 2 hours) - Daily recurring meeting
2. **Project Review** (tomorrow) - Weekly meeting with password
3. **Client Presentation** (in 3 days) - One-time private meeting

### 2. **Access Meetings**
- Navigate to **Meetings** in the sidebar
- Or visit: http://localhost:5178/meetings

### 3. **Test Features**
- Click "Join Demo" to test meeting room
- Try screen sharing, chat, and file sharing
- Add participants and test controls

### 4. **Integration Points**
- Meeting buttons added to Task Details pages
- Meeting buttons added to Project Details pages
- Schedule meetings directly from tasks/projects

## 🔧 **Development Setup**

### **Environment Variables** (Optional)
Create \`.env.local\` file:

\`\`\`
VITE_WEBSOCKET_URL=wss://your-websocket-server.com/cable
VITE_TURN_SERVER_URL=turn:your-turn-server.com:3478
VITE_TURN_USERNAME=your-turn-username
VITE_TURN_CREDENTIAL=your-turn-password
\`\`\`

### **WebSocket Backend** (Required for Production)
You'll need to implement these ActionCable channels:

1. **MeetingChannel**
   - Handle meeting updates
   - Participant join/leave events
   - Chat messages

2. **MeetingSignalingChannel**
   - WebRTC signaling data
   - Peer connection establishment

### **API Endpoints** (Required for Production)
Implement these endpoints:

- \`POST /api/meetings\` - Create meeting
- \`GET /api/meetings\` - List meetings
- \`GET /api/meetings/:id\` - Get meeting details
- \`PUT /api/meetings/:id\` - Update meeting
- \`DELETE /api/meetings/:id\` - Delete meeting

## 📱 **Testing**

### **Local Testing**
1. Start the dev server: \`npm run dev\`
2. Open multiple browser tabs/windows
3. Join the same meeting from different tabs
4. Test all features

### **Network Testing**
1. Get your local IP: \`ipconfig getifaddr en0\` (Mac) or \`ipconfig\` (Windows)
2. Access from other devices: \`http://YOUR_IP:5178\`
3. Test cross-device meeting functionality

### **Production Testing**
1. Deploy with HTTPS enabled
2. Configure proper STUN/TURN servers
3. Test with real users across different networks

## 🎯 **Next Steps**

1. **Customize Styling**: Edit Tailwind classes in meeting components
2. **Add Backend**: Implement WebSocket channels and API endpoints
3. **Configure TURN**: Add TURN servers for production use
4. **Add Features**: Implement recording, transcription, etc.

## 📚 **Documentation**

- See \`MEETINGS_README.md\` for detailed feature documentation
- Check component files for implementation details
- Review \`useWebRTCMeeting.js\` for WebRTC logic

## 🐛 **Troubleshooting**

**Issue**: Camera/microphone not working
**Solution**: Ensure HTTPS in production, check browser permissions

**Issue**: Can't connect to other participants
**Solution**: Configure STUN/TURN servers properly

**Issue**: Poor video quality
**Solution**: Check network bandwidth, reduce participant count

## 🎉 **You're Ready!**

Your Nextcloud-style meeting functionality is now integrated into your task management application. Start by visiting the meetings page and clicking "Join Demo" to test everything out!

Happy meeting! 🎬✨
`;

console.log('🎬 Setting up Meeting Functionality...\n');

// Create demo meetings file
try {
  const meetings = demoMeetings.map(meeting => ({
    ...meeting,
    meetingUrl: `http://localhost:5178/meeting/${meeting.id}`,
    createdAt: new Date().toISOString()
  }));
  
  writeFileSync(DEMO_MEETINGS_FILE, JSON.stringify(meetings, null, 2));
  console.log('✅ Created demo meetings data');
} catch (error) {
  console.log('⚠️  Could not create demo meetings file:', error.message);
}

// Create setup instructions
try {
  writeFileSync(README_FILE, setupInstructions);
  console.log('✅ Created setup instructions');
} catch (error) {
  console.log('⚠️  Could not create setup instructions:', error.message);
}

console.log('\n🎉 Meeting functionality setup complete!');
console.log('\n📖 Next steps:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Visit: http://localhost:5178/meetings');
console.log('3. Click "Join Demo" to test the functionality');
console.log('4. Read MEETINGS_SETUP.md for detailed instructions\n');

export default {
  demoMeetings,
  setupInstructions
};
