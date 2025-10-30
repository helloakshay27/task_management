// import { useEffect, useRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//     createMessage,
//     fetchMessagesOfConversation,
//     resetSendMessage,
// } from "../../../../redux/slices/channelSlice";
// import { useWebSocket } from "../../../../hooks/useWebSocket";
// import toast from "react-hot-toast";

// const ChatView = ({ type, id }) => {
//     const token = localStorage.getItem("token");
//     const currentUser = JSON.parse(localStorage.getItem("user"));
//     const dispatch = useDispatch();
//     const bottomRef = useRef(null);
//     const { success } = useSelector((state) => state.createMessage);

//     const [input, setInput] = useState("");
//     const [messages, setMessages] = useState([]);
//     const [page, setPage] = useState(1);
//     const [hasMore, setHasMore] = useState(true);
//     const chatContainerRef = useRef(null);
//     const isUserInitiatedScroll = useRef(false);

//     const socketUrl = "wss://uat-tasks.lockated.com/cable"

//     const { manager: webSocketManager, connect } = useWebSocket();

//     useEffect(() => {
//         if (bottomRef.current && !isUserInitiatedScroll.current) {
//             bottomRef.current.scrollIntoView({ behavior: "smooth" });
//         }
//     }, [messages]);

//     useEffect(() => {
//         const fetchMessages = async () => {
//             const container = chatContainerRef.current;
//             const prevScrollHeight = container?.scrollHeight ?? 0;
//             const prevScrollTop = container?.scrollTop ?? 0;

//             try {
//                 const { messages: fetchedMessages, meta } = await dispatch(
//                     fetchMessagesOfConversation({ token, id, page })
//                 ).unwrap();

//                 connect(token, socketUrl)

//                 setMessages((prevMessages) => {
//                     const existingIds = new Set(prevMessages.map((msg) => msg.id));
//                     const newMessages = fetchedMessages.filter((msg) => !existingIds.has(msg.id));
//                     return [...prevMessages, ...newMessages];
//                 });

//                 setHasMore(meta.next_page !== null);

//                 setTimeout(() => {
//                     if (container) {
//                         const newScrollHeight = container.scrollHeight;
//                         const scrollDiff = newScrollHeight - prevScrollHeight;
//                         container.scrollTop = prevScrollTop + scrollDiff;
//                     }
//                 }, 0);

//             } catch (error) {
//                 console.error("Failed to fetch messages:", error);
//             }
//         };

//         if (page && token && id) {
//             fetchMessages();
//         }
//     }, [page, token, id, dispatch]);

//     useEffect(() => {
//         const container = chatContainerRef.current;
//         if (!container) return;

//         const handleScroll = () => {
//             if (container.scrollTop === 0 && hasMore) {
//                 isUserInitiatedScroll.current = true;
//                 setPage((prev) => prev + 1);
//             }
//         };

//         container.addEventListener("scroll", handleScroll);
//         return () => container.removeEventListener("scroll", handleScroll);
//     }, [hasMore]);

//     useEffect(() => {
//         if (type === "chat") {
//             webSocketManager.subscribeToConversation(id, {
//                 onNewMessage: (message) => {
//                     console.log("📩 Chat message received:", message);
//                     setMessages((prev) => [...prev, message]);
//                     isUserInitiatedScroll.current = false;
//                 },
//             });
//         } else if (type === "group") {
//             webSocketManager.subscribeToProjectSpace(id, {
//                 onNewMessage: (message) => {
//                     console.log("📩 Group message received:", message);
//                     setMessages((prev) => [...prev, message]);
//                     isUserInitiatedScroll.current = false;
//                 },
//             });
//         }
//     }, [type, id]);

//     const sendMessage = async (e) => {
//         e.preventDefault();
//         if (!input.trim()) return;

//         const payload = {
//             body: input,
//             project_space_id: type === "group" ? id : null,
//             conversation_id: type === "chat" ? id : null,
//         };

//         try {
//             const response = await dispatch(
//                 createMessage({ token, payload })
//             ).unwrap();

//             setMessages((prev) => [response, ...prev]);
//             setInput("");
//             dispatch(resetSendMessage());
//             isUserInitiatedScroll.current = false;
//         } catch (err) {
//             console.error("Failed to send message:", err);
//             toast.dismiss();
//             toast.error("Internal server error");
//         }
//     };

//     useEffect(() => {
//         if (success) {
//             setInput("");
//             dispatch(resetSendMessage());
//         }
//     }, [success]);

//     const formatTimestamp = (isoString) => {
//         const date = new Date(isoString);
//         return `${date.toLocaleDateString("en-IN", {
//             day: "numeric",
//             month: "short",
//         })}, ${date.toLocaleTimeString("en-IN", {
//             hour: "2-digit",
//             minute: "2-digit",
//         })}`;
//     };

//     return (
//         <div className="flex flex-col w-full h-full overflow-hidden">
//             <div
//                 ref={chatContainerRef}
//                 className="flex-1 w-full bg-[#F9F9F9] px-6 py-4 overflow-y-auto max-h-[calc(100vh-160px)]"
//             >
//                 {[...messages].reverse().map((message, index) => (
//                     <div
//                         key={index}
//                         className={`mb-6 flex flex-col ${message.user_id === currentUser.id ? "items-end" : "items-start"}`}
//                     >
//                         <div
//                             className={`text-xs text-gray-500 mb-2 ${message.user_id === currentUser.id ? "mr-14" : "ml-14"}`}
//                         >
//                             {formatTimestamp(message.created_at)}
//                         </div>
//                         <div className="flex items-start space-x-3">
//                             {message.user_id !== currentUser.id && (
//                                 <div className="w-8 h-8 rounded-full bg-[#5986FF] text-white text-sm flex items-center justify-center">
//                                     {(message.user_name || "U")[0].toUpperCase()}
//                                 </div>
//                             )}
//                             <div className="bg-white rounded-2xl px-4 py-2 text-sm shadow max-w-xs">
//                                 {message.body}
//                             </div>
//                             {message.user_id === currentUser.id && (
//                                 <div className="w-8 h-8 rounded-full bg-[#5986FF] text-white text-sm flex items-center justify-center">
//                                     {(message.user_name || "U")[0].toUpperCase()}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 ))}
//                 <div ref={bottomRef} className="h-0" />
//             </div>

//             <div className="w-[800px] mx-auto bg-white px-6 py-6 flex items-center space-x-2">
//                 <div className="relative flex-1">
//                     <input
//                         type="text"
//                         placeholder="Type here and hit enter"
//                         className="w-full bg-[#F9F9F9] rounded-full px-4 py-4 pr-10 text-sm focus:outline-none"
//                         value={input}
//                         onChange={(e) => setInput(e.target.value)}
//                         onKeyDown={(e) => {
//                             if (e.key === "Enter") sendMessage(e);
//                         }}
//                     />
//                 </div>
//                 <button
//                     type="button"
//                     className="text-gray-500 text-xl"
//                     onClick={sendMessage}
//                 >
//                     <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
//                         <path
//                             d="M4.25 28.3332V19.8332L15.5833 16.9998L4.25 14.1665V5.6665L31.1667 16.9998L4.25 28.3332Z"
//                             fill="black"
//                             fillOpacity="0.2"
//                         />
//                     </svg>
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default ChatView;





import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    createMessage,
    fetchMessagesOfConversation,
    resetSendMessage,
} from "../../../../redux/slices/channelSlice";
import { useWebSocket } from "../../../../hooks/useWebSocket";
import toast from "react-hot-toast";

const ChatView = ({ type, id }) => {
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const dispatch = useDispatch();
    const bottomRef = useRef(null);
    const { success } = useSelector((state) => state.createMessage);

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const chatContainerRef = useRef(null);
    const isUserInitiatedScroll = useRef(false);

    const socketUrl = "wss://uat-tasks.lockated.com/cable";

    const { manager: webSocketManager, connect } = useWebSocket();

    // Debug: Component lifecycle
    useEffect(() => {
        console.log('🎬 ChatView MOUNTED');
        console.log('   - Type:', type);
        console.log('   - ID:', id);
        console.log('   - Token:', token ? 'Present' : 'Missing');

        return () => {
            console.log('🎬 ChatView UNMOUNTING');
        };
    }, []);

    // Connect WebSocket ONCE on mount
    useEffect(() => {
        console.log('🔌 WebSocket connection effect running');

        if (token) {
            console.log('✅ Token available, connecting...');
            connect(token, socketUrl);
        } else {
            console.error('❌ No token available for WebSocket connection');
        }

        return () => {
            console.log('🧹 Cleaning up WebSocket subscriptions');
            if (type === "chat" && id) {
                webSocketManager.unsubscribeFromConversation(id);
            } else if (type === "group" && id) {
                webSocketManager.unsubscribeFromProjectSpace(id);
            }
        };
    }, [token, connect]); // Only run when token changes (essentially on mount)

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current && !isUserInitiatedScroll.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Fetch messages with pagination
    useEffect(() => {
        const fetchMessages = async () => {
            console.log(`📥 Fetching messages - Page: ${page}, Type: ${type}, ID: ${id}`);

            const container = chatContainerRef.current;
            const prevScrollHeight = container?.scrollHeight ?? 0;
            const prevScrollTop = container?.scrollTop ?? 0;

            try {
                const { messages: fetchedMessages, meta } = await dispatch(
                    fetchMessagesOfConversation({ token, id, page })
                ).unwrap();

                console.log(`✅ Fetched ${fetchedMessages.length} messages`);

                setMessages((prevMessages) => {
                    const existingIds = new Set(prevMessages.map((msg) => msg.id));
                    const newMessages = fetchedMessages.filter((msg) => !existingIds.has(msg.id));
                    console.log(`   - Adding ${newMessages.length} new messages to state`);
                    return [...prevMessages, ...newMessages];
                });

                setHasMore(meta.next_page !== null);
                console.log(`   - Has more pages:`, meta.next_page !== null);

                // Restore scroll position after loading older messages
                setTimeout(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        const scrollDiff = newScrollHeight - prevScrollHeight;
                        container.scrollTop = prevScrollTop + scrollDiff;
                    }
                }, 0);
            } catch (error) {
                console.error("❌ Failed to fetch messages:", error);
                toast.error("Failed to load messages");
            }
        };

        if (page && token && id) {
            fetchMessages();
        }
    }, [page, token, id, dispatch]);

    // Handle infinite scroll
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && hasMore) {
                console.log('📜 User scrolled to top, loading more messages...');
                isUserInitiatedScroll.current = true;
                setPage((prev) => prev + 1);
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [hasMore]);

    // Subscribe to WebSocket channels - WAIT for connection
    useEffect(() => {
        // if (!id || isSubscribed) {
        //     console.log('⏸️ Skipping subscription:', {
        //         id: !!id,
        //         isSubscribed
        //     });
        //     return;
        // }

        console.log('⏰ Waiting 2 seconds before subscribing to allow connection to establish...');

        const subscriptionTimer = setTimeout(() => {
            console.log(`📡 Now subscribing to ${type} channel, ID: ${id}`);

            if (type === "chat") {
                const sub = webSocketManager.subscribeToConversation(id, {
                    onConnected: () => {
                        console.log('🎉 SUBSCRIPTION SUCCESSFUL - Chat connected!');
                        setIsSubscribed(true);
                        toast.success('Real-time chat connected!', { duration: 2000 });
                    },
                    onNewMessage: (message) => {
                        console.log('💬 NEW MESSAGE RECEIVED IN CHAT VIEW');
                        console.log('   - Message:', message);
                        console.log('   - Current user ID:', currentUser.id);
                        console.log('   - Message user ID:', message.user_id);

                        setMessages((prev) => {
                            const exists = prev.some(msg => msg.id === message.id);
                            if (exists) {
                                console.log('⚠️ Duplicate message prevented, ID:', message.id);
                                return prev;
                            }
                            console.log('✅ Adding message to UI state');

                            // Show notification for messages from others
                            if (message.user_id !== currentUser.id) {
                                toast.success(`New message from ${message.user_name || 'User'}`, {
                                    duration: 3000
                                });
                            }

                            return [message, ...prev];
                        });
                        isUserInitiatedScroll.current = false;
                    },
                    onDisconnected: () => {
                        console.log('❌ Chat subscription disconnected');
                        setIsSubscribed(false);
                        toast.error('Real-time chat disconnected');
                    }
                });
                console.log('📋 Subscription object:', sub);
            } else if (type === "group") {
                const sub = webSocketManager.subscribeToProjectSpace(id, {
                    onConnected: () => {
                        console.log('🎉 SUBSCRIPTION SUCCESSFUL - Group connected!');
                        setIsSubscribed(true);
                        toast.success('Real-time group chat connected!', { duration: 2000 });
                    },
                    onNewMessage: (message) => {
                        console.log('💬 NEW MESSAGE RECEIVED IN GROUP VIEW');
                        console.log('   - Message:', message);
                        console.log('   - Current user ID:', currentUser.id);
                        console.log('   - Message user ID:', message.user_id);

                        setMessages((prev) => {
                            const exists = prev.some(msg => msg.id === message.id);
                            if (exists) {
                                console.log('⚠️ Duplicate message prevented, ID:', message.id);
                                return prev;
                            }
                            console.log('✅ Adding message to UI state');

                            // Show notification for messages from others
                            if (message.user_id !== currentUser.id) {
                                toast.success(`New message from ${message.user_name || 'User'}`, {
                                    duration: 3000
                                });
                            }

                            return [message, ...prev];
                        });
                        isUserInitiatedScroll.current = false;
                    },
                    onDisconnected: () => {
                        console.log('❌ Group subscription disconnected');
                        setIsSubscribed(false);
                        toast.error('Real-time group chat disconnected');
                    }
                });
                console.log('📋 Subscription object:', sub);
            }
        }, 2000); // Wait 2 seconds for connection to establish

        return () => {
            console.log('⏰ Clearing subscription timer');
            clearTimeout(subscriptionTimer);
        };
    }, [type, id, isSubscribed, webSocketManager, currentUser.id]);

    // Send message handler
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) {
            console.log('⚠️ Empty message, not sending');
            return;
        }

        console.log('📤 Sending message:', input);

        const payload = {
            body: input,
            project_space_id: type === "group" ? id : null,
            conversation_id: type === "chat" ? id : null,
        };

        const tempInput = input;
        setInput(""); // Clear input immediately for better UX

        try {
            const response = await dispatch(
                createMessage({ token, payload })
            ).unwrap();

            console.log('✅ Message sent successfully:', response);

            // Add message optimistically (will be deduplicated if WebSocket sends it too)
            setMessages((prev) => {
                const exists = prev.some(msg => msg.id === response.id);
                if (exists) {
                    console.log('⚠️ Message already in state');
                    return prev;
                }
                console.log('✅ Adding sent message to state');
                return [response, ...prev];
            });

            dispatch(resetSendMessage());
            isUserInitiatedScroll.current = false;
        } catch (err) {
            console.error("❌ Failed to send message:", err);
            setInput(tempInput); // Restore input on error
            toast.dismiss();
            toast.error("Failed to send message");
        }
    };

    // Reset input on success (backup)
    useEffect(() => {
        if (success) {
            setInput("");
            dispatch(resetSendMessage());
        }
    }, [success, dispatch]);

    // Format timestamp
    const formatTimestamp = (isoString) => {
        const date = new Date(isoString);
        return `${date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        })}, ${date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    };

    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            {/* Connection status indicator */}
            {!isSubscribed && (
                <div className="bg-yellow-100 text-yellow-800 text-xs px-4 py-2 text-center">
                    🔄 Connecting to real-time chat...
                </div>
            )}

            <div
                ref={chatContainerRef}
                className="flex-1 w-full bg-[#F9F9F9] px-6 py-4 overflow-y-auto max-h-[calc(100vh-160px)]"
            >
                {[...messages].reverse().map((message) => (
                    <div
                        key={message.id}
                        className={`mb-6 flex flex-col ${message.user_id === currentUser.id ? "items-end" : "items-start"}`}
                    >
                        <div
                            className={`text-xs text-gray-500 mb-2 ${message.user_id === currentUser.id ? "mr-14" : "ml-14"}`}
                        >
                            {formatTimestamp(message.created_at)}
                        </div>
                        <div className="flex items-start space-x-3">
                            {message.user_id !== currentUser.id && (
                                <div className="w-8 h-8 rounded-full bg-[#5986FF] text-white text-sm flex items-center justify-center flex-shrink-0">
                                    {(message.user_name || "U")[0].toUpperCase()}
                                </div>
                            )}
                            <div className="bg-white rounded-2xl px-4 py-2 text-sm shadow max-w-xs break-words">
                                {message.body}
                            </div>
                            {message.user_id === currentUser.id && (
                                <div className="w-8 h-8 rounded-full bg-[#5986FF] text-white text-sm flex items-center justify-center flex-shrink-0">
                                    {(message.user_name || "U")[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} className="h-0" />
            </div>

            <div className="w-full max-w-[800px] mx-auto bg-white px-6 py-6 flex items-center space-x-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Type here and hit enter"
                        className="w-full bg-[#F9F9F9] rounded-full px-4 py-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5986FF]"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage(e);
                            }
                        }}
                    />
                </div>
                <button
                    type="button"
                    className="text-gray-500 text-xl hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={sendMessage}
                    disabled={!input.trim()}
                >
                    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                        <path
                            d="M4.25 28.3332V19.8332L15.5833 16.9998L4.25 14.1665V5.6665L31.1667 16.9998L4.25 28.3332Z"
                            fill="black"
                            fillOpacity={input.trim() ? "0.8" : "0.2"}
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatView;