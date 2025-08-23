import { createConsumer } from "@rails/actioncable";

class WebSocketManager {
    constructor() {
        this.cable = null;
        this.subscriptions = new Map();
        this.token = null;
    }

    // Initialize connection with access token
    connect(accessToken, wsUrl = '/cable') {
        this.token = accessToken;

        // Create the WebSocket URL with token
        const fullWsUrl = wsUrl.includes('?')
            ? `${wsUrl}&token=${accessToken}`
            : `${wsUrl}?token=${accessToken}`;

        console.log('Connecting to WebSocket URL:', fullWsUrl);

        // Create cable connection with token in URL params
        this.cable = createConsumer(fullWsUrl);

        // Add connection monitoring
        this.cable.connection.monitor.visibilityDidChange = () => {
            console.log('WebSocket visibility changed:', document.visibilityState);
        };

        console.log('WebSocket connection initialized');
        return this.cable;
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.cable) {
            this.cable.disconnect();
            this.cable = null;
            this.subscriptions.clear();
            console.log('WebSocket disconnected');
        }
    }

    // Subscribe to user notifications
    subscribeToUserNotifications(callbacks = {}) {
        if (!this.cable) {
            console.error('WebSocket not connected. Call connect() first.');
            return null;
        }

        const subscription = this.cable.subscriptions.create(
            { channel: 'UserChannel' },
            {
                connected: () => {
                    console.log('Connected to UserChannel');
                    callbacks.onConnected?.();
                },

                disconnected: () => {
                    console.log('Disconnected from UserChannel');
                    callbacks.onDisconnected?.();
                },

                received: (data) => {
                    console.log('Received user notification:', data);

                    switch (data.type) {
                        case 'new_conversation':
                            callbacks.onNewConversation?.(data.conversation);
                            break;
                        case 'message_notification':
                            callbacks.onMessageNotification?.(data.message, data.context);
                            break;
                        default:
                            console.log('Unknown notification type:', data.type);
                    }
                }
            }
        );

        this.subscriptions.set('user_notifications', subscription);
        return subscription;
    }

    // Subscribe to a specific conversation
    subscribeToConversation(conversationId, callbacks = {}) {
        if (!this.cable) {
            console.error('WebSocket not connected. Call connect() first.');
            return null;
        }

        const channelKey = `conversation_${conversationId}`;

        // Unsubscribe from previous conversation if exists
        this.unsubscribeFromConversation(conversationId);

        const subscription = this.cable.subscriptions.create(
            {
                channel: 'ConversationChannel',
                conversation_id: conversationId
            },
            {
                connected: () => {
                    console.log(`✅ Connected to conversation ${conversationId}`);
                    console.log(`📡 Expected stream: conversation_${conversationId}`);
                    callbacks.onConnected?.();
                },

                disconnected: () => {
                    console.log(`❌ Disconnected from conversation ${conversationId}`);
                    callbacks.onDisconnected?.();
                },

                received: (data) => {
                    console.log('📨 Received conversation data:', data);
                    console.log(`📨 Stream should be: conversation_${conversationId}`);

                    switch (data.type) {
                        case 'new_message':
                            console.log('📨 New message received:', data.message);
                            callbacks.onNewMessage?.(data.message);
                            break;
                        default:
                            console.log('❓ Unknown message type:', data.type);
                    }
                }
            }
        );

        this.subscriptions.set(channelKey, subscription);
        return subscription;
    }

    // Subscribe to a specific project space
    subscribeToProjectSpace(projectSpaceId, callbacks = {}) {
        if (!this.cable) {
            console.error('WebSocket not connected. Call connect() first.');
            return null;
        }

        const channelKey = `project_space_${projectSpaceId}`;

        // Unsubscribe from previous project space if exists
        this.unsubscribeFromProjectSpace(projectSpaceId);

        const subscription = this.cable.subscriptions.create(
            {
                channel: 'ProjectSpaceChannel',
                project_space_id: projectSpaceId
            },
            {
                connected: () => {
                    console.log(`Connected to project space ${projectSpaceId}`);
                    callbacks.onConnected?.();
                },

                disconnected: () => {
                    console.log(`Disconnected from project space ${projectSpaceId}`);
                    callbacks.onDisconnected?.();
                },

                received: (data) => {
                    console.log('Received project space data:', data);

                    switch (data.type) {
                        case 'new_message':
                            callbacks.onNewMessage?.(data.message);
                            break;
                        default:
                            console.log('Unknown message type:', data.type);
                    }
                }
            }
        );

        this.subscriptions.set(channelKey, subscription);
        return subscription;
    }

    // Subscribe to meeting updates
    subscribeToMeeting(meetingId, callbacks = {}) {
        if (!this.cable) {
            console.error('WebSocket not connected. Call connect() first.');
            return null;
        }

        const channelKey = `meeting_${meetingId}`;

        // Unsubscribe from previous meeting if exists
        this.unsubscribeFromMeeting(meetingId);

        const subscription = this.cable.subscriptions.create(
            {
                channel: 'MeetingChannel',
                meeting_id: meetingId
            },
            {
                connected: () => {
                    console.log(`Connected to meeting ${meetingId}`);
                    callbacks.onConnected?.();
                },

                disconnected: () => {
                    console.log(`Disconnected from meeting ${meetingId}`);
                    callbacks.onDisconnected?.();
                },

                received: (data) => {
                    console.log('Received meeting data:', data);

                    switch (data.type) {
                        case 'participant_joined':
                            callbacks.onParticipantJoined?.(data.participant);
                            break;
                        case 'participant_left':
                            callbacks.onParticipantLeft?.(data.participant);
                            break;
                        case 'chat_message':
                            callbacks.onMessage?.(data.message);
                            break;
                        case 'hand_raised':
                            callbacks.onHandRaised?.(data.participant);
                            break;
                        case 'screen_share':
                            callbacks.onScreenShare?.(data.participant, data.isSharing);
                            break;
                        case 'meeting_ended':
                            callbacks.onMeetingEnded?.(data.reason);
                            break;
                        default:
                            console.log('Unknown meeting message type:', data.type);
                    }
                }
            }
        );

        this.subscriptions.set(channelKey, subscription);
        return subscription;
    }

    // Subscribe to meeting signaling for WebRTC
    subscribeToMeetingSignaling(meetingId, callbacks = {}) {
        if (!this.cable) {
            console.error('WebSocket not connected. Call connect() first.');
            return null;
        }

        const channelKey = `meeting_signaling_${meetingId}`;

        const subscription = this.cable.subscriptions.create(
            {
                channel: 'MeetingSignalingChannel',
                meeting_id: meetingId
            },
            {
                connected: () => {
                    console.log(`Connected to meeting signaling ${meetingId}`);
                    callbacks.onConnected?.();
                },

                disconnected: () => {
                    console.log(`Disconnected from meeting signaling ${meetingId}`);
                    callbacks.onDisconnected?.();
                },

                received: (data) => {
                    console.log('Received signaling data:', data);

                    switch (data.type) {
                        case 'webrtc-signal':
                            callbacks.onSignal?.(data);
                            break;
                        case 'participant_joined':
                            callbacks.onParticipantJoined?.(data.participant);
                            break;
                        case 'participant_left':
                            callbacks.onParticipantLeft?.(data.participant);
                            break;
                        default:
                            console.log('Unknown signaling message type:', data.type);
                    }
                }
            }
        );

        this.subscriptions.set(channelKey, subscription);
        return subscription;
    }

    // Send meeting update
    sendMeetingUpdate(meetingId, data) {
        const subscription = this.subscriptions.get(`meeting_${meetingId}`);
        if (subscription) {
            subscription.send({
                type: 'meeting_update',
                ...data
            });
        }
    }

    // Send WebRTC signaling data
    sendMeetingSignal(meetingId, data) {
        const subscription = this.subscriptions.get(`meeting_signaling_${meetingId}`);
        if (subscription) {
            subscription.send({
                type: 'signaling_data',
                ...data
            });
        }
    }

    // Unsubscribe from conversation
    unsubscribeFromConversation(conversationId) {
        const channelKey = `conversation_${conversationId}`;
        const subscription = this.subscriptions.get(channelKey);

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(channelKey);
            console.log(`Unsubscribed from conversation ${conversationId}`);
        }
    }

    // Unsubscribe from project space
    unsubscribeFromProjectSpace(projectSpaceId) {
        const channelKey = `project_space_${projectSpaceId}`;
        const subscription = this.subscriptions.get(channelKey);

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(channelKey);
            console.log(`Unsubscribed from project space ${projectSpaceId}`);
        }
    }

    // Unsubscribe from user notifications
    unsubscribeFromUserNotifications() {
        const subscription = this.subscriptions.get('user_notifications');

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete('user_notifications');
            console.log('Unsubscribed from user notifications');
        }
    }

    // Unsubscribe from meeting
    unsubscribeFromMeeting(meetingId) {
        const channelKey = `meeting_${meetingId}`;
        const subscription = this.subscriptions.get(channelKey);

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(channelKey);
            console.log(`Unsubscribed from meeting ${meetingId}`);
        }
    }

    // Unsubscribe from meeting signaling
    unsubscribeFromMeetingSignaling(meetingId) {
        const channelKey = `meeting_signaling_${meetingId}`;
        const subscription = this.subscriptions.get(channelKey);

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(channelKey);
            console.log(`Unsubscribed from meeting signaling ${meetingId}`);
        }
    }

    // Get current connection status
    isConnected() {
        return this.cable && this.cable.connection.isOpen();
    }

    // Get all active subscriptions
    getActiveSubscriptions() {
        return Array.from(this.subscriptions.keys());
    }
}

// Create singleton instance
const webSocketManager = new WebSocketManager();

export default webSocketManager;
