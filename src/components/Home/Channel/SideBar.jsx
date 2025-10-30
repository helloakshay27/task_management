import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChannels, fetchConversations, resetstartConversation, startConversation } from '../../../redux/slices/channelSlice';
import { useNavigate } from 'react-router-dom';
import { fetchUsers } from '../../../redux/slices/userSlice';

const SideBar = () => {
    const token = localStorage.getItem('token')
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;

    const { fetchChannels: channels } = useSelector(state => state.fetchChannels)
    const { fetchConversations: conversations } = useSelector(state => state.fetchConversations)
    const { fetchUsers: users } = useSelector(state => state.fetchUsers)
    const { startConversation: newConversation } = useSelector(state => state.startConversation)

    const [openSections, setOpenSections] = useState({
        dms: true,
        groups: true,
        users: true
    });

    useEffect(() => {
        dispatch(fetchChannels({ token }))
        dispatch(fetchConversations({ token }))
        dispatch(fetchUsers({ token }))
    }, [dispatch])

    const toggleSection = (section) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleCreateConversation = (userId) => {
        const payload = {
            conversation: {
                sender_id: JSON.parse(localStorage.getItem('user')).id,
                recipient_id: userId,
            }
        }

        dispatch(startConversation({ token, payload }))
    }

    useEffect(() => {
        if (newConversation && !Array.isArray(newConversation)) {
            navigate(`/channels/chat/${newConversation.id}`);
            dispatch(resetstartConversation())
        }
    }, [newConversation])

    return (
        <div className="w-64 h-full border-r shadow-sm p-4 space-y-6">
            <button className="bg-[#C72030] text-white w-full py-3 flex items-center justify-center rounded-sm font-normal hover:bg-red-800">
                <Plus size={12} className="mr-2 text-xs" />
                <span className="font-normal text-xs">New Chat</span>
            </button>
            <div className="space-y-4 text-sm">
                <div>
                    <div
                        className="flex items-center justify-between cursor-pointer hover:text-gray-600"
                    >
                        <span className="text-sm font-medium">Home</span>
                        <ChevronRight size={16} />
                    </div>
                </div>
                <div className="flex items-center justify-between cursor-pointer hover:text-gray-600">
                    <span className="text-sm font-medium">Starred</span>
                    <ChevronRight size={16} />
                </div>
                <div className='space-y-3'>
                    <div
                        onClick={() => toggleSection('dms')}
                        className="flex items-center justify-between cursor-pointer hover:text-gray-600"
                    >
                        <span className="text-sm font-medium">Direct Messages</span>
                        {openSections.dms ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    {openSections.dms && (
                        <ul className="mt-2 space-y-4 text-gray-800 font-normal">
                            {
                                conversations && conversations.map(conversation => {
                                    const displayedName =
                                        currentUserId === conversation.sender_id
                                            ? conversation.receiver_name
                                            : conversation.sender_name;
                                    return (
                                        <li key={conversation.id} className="text-xs cursor-pointer" onClick={() => navigate(`/channels/chat/${conversation.id}`)}>
                                            {displayedName}
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    )}
                </div>
                <div>
                    <div
                        onClick={() => toggleSection('groups')}
                        className="flex items-center justify-between cursor-pointer hover:text-gray-600"
                    >
                        <span className="text-sm font-medium">Groups</span>
                        {openSections.groups ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    {openSections.groups && (
                        <ul className="mt-2 space-y-4 text-gray-800 font-normal overflow-y-scroll max-h-48">
                            {
                                channels && channels.map(channel => (
                                    <li key={channel.id} className="text-xs cursor-pointer" onClick={() => navigate(`/channels/group/${channel.id}`)}>{channel.name}</li>
                                ))
                            }
                        </ul>
                    )}
                </div>
                <div>
                    <div
                        onClick={() => toggleSection('users')}
                        className="flex items-center justify-between cursor-pointer hover:text-gray-600"
                    >
                        <span className="text-sm font-medium">Users</span>
                        {openSections.users ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    {openSections.users && (
                        <ul className="mt-2 space-y-4 text-gray-800 font-normal overflow-y-scroll max-h-48">
                            {
                                users ? users
                                    .filter(user => {
                                        // Exclude users already in conversations
                                        return !conversations.some(
                                            (conv) =>
                                                conv.receiver_id === user.id || // if you store `receiver_id`
                                                conv.recipient_id === user.id    // or `recipient_id`
                                        );
                                    })
                                    .map(user => (
                                        <li
                                            key={user.id}
                                            className="text-xs cursor-pointer"
                                            onClick={() => handleCreateConversation(user.id)}
                                        >
                                            {user.firstname + ' ' + user.lastname}
                                        </li>
                                    ))
                                    : []
                            }
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SideBar;






// import { ChevronDown, ChevronRight } from "lucide-react";
// import { useEffect, useRef, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// // import NewConversationModal from "./NewConversationModal";
// import { useDispatch } from "react-redux";
// import { fetchInternalUser } from "../../../redux/slices/userSlice";
// import { fetchChannels, fetchConversations } from "../../../redux/slices/channelSlice";

// const ChannelSidebar = () => {
//     const { id } = useParams();
//     const dispatch = useDispatch();
//     const navigate = useNavigate();
//     const token = localStorage.getItem("token");

//     const modalRef = useRef(null);

//     const [isGroupsOpen, setIsGroupsOpen] = useState(false);
//     const [isMessagesOpen, setIsMessagesOpen] = useState(false);
//     const [users, setUsers] = useState([]);
//     const [newConversationModal, setNewConversationModal] = useState(false);
//     const [searchQuery, setSearchQuery] = useState("");
//     const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
//     const [conversations, setConversations] = useState([]);
//     const [groups, setGroups] = useState([]);

//     const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;

//     const fetchInternalUsers = async () => {
//         try {
//             const response = await dispatch(fetchInternalUser()).unwrap();
//             setUsers(response);
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     const getConversations = async () => {
//         try {
//             const response = await dispatch(
//                 fetchConversations({ token })
//             ).unwrap();
//             setConversations(response);
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     const getGroups = async () => {
//         try {
//             const response = await dispatch(fetchChannels({ token })).unwrap();
//             setGroups(response);
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     useEffect(() => {
//         fetchInternalUsers();
//         getConversations();
//         getGroups();
//     }, []);

//     const handleSidebarSearch = (e) => {
//         const query = e.target.value;
//         setSidebarSearchQuery(query);

//         if (query) {
//             setIsMessagesOpen(true);
//             setIsGroupsOpen(true);
//         }
//     };

//     const filteredConversations = conversations.filter((conversation) => {
//         const displayedName =
//             currentUserId === conversation.sender_id
//                 ? conversation.receiver_name
//                 : conversation.sender_name;

//         return displayedName.toLowerCase().includes(sidebarSearchQuery.toLowerCase());
//     });

//     const filteredGroups = groups.filter((group) =>
//         group.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
//     );

//     const filteredUsers = users.filter((user) =>
//         user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     useEffect(() => {
//         function handleClickOutside(e) {
//             if (modalRef.current && !modalRef.current.contains(e.target)) {
//                 setNewConversationModal(false);
//             }
//         }

//         if (newConversationModal) {
//             document.addEventListener("mousedown", handleClickOutside);
//         }

//         return () => {
//             document.removeEventListener("mousedown", handleClickOutside);
//         };
//     }, [newConversationModal]);

//     return (
//         <div className="w-64 h-full py-3 border-r border-gray-200 shadow-md space-y-2 relative">
//             <div className="w-full px-3" onClick={() => setNewConversationModal(true)}>
//                 <button className="w-full h-[28px] sm:h-[36px] px-4 py-1.5 !bg-[#F2EEE9] !text-[#BF213E] [&_svg]:text-[#BF213E]">+ New Chat</button>
//             </div>

//             <div className="px-3">
//                 <input
//                     type="text"
//                     placeholder="Search..."
//                     className="w-full border border-gray-200 rounded-[2px] bg-transparent px-3 py-1 focus:outline-none"
//                     value={sidebarSearchQuery}
//                     onChange={handleSidebarSearch}
//                 />
//             </div>

//             <div>
//                 <button
//                     className="flex items-center justify-between cursor-pointer hover:bg-gray-100 py-2 px-3 w-full"
//                     onClick={() => setIsMessagesOpen(!isMessagesOpen)}
//                 >
//                     <span className="text-sm font-medium">Direct Messages</span>
//                     {isMessagesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//                 </button>

//                 {isMessagesOpen && (
//                     <div className="pl-6 space-y-1 max-h-[15rem] overflow-auto">
//                         {
//                             filteredConversations.length > 0 ? (
//                                 filteredConversations.map((conversation) => {
//                                     const displayedName =
//                                         currentUserId === conversation.sender_id
//                                             ? conversation.receiver_name
//                                             : conversation.sender_name;

//                                     return (
//                                         <div
//                                             className={`text-sm text-gray-700 cursor-pointer hover:text-[#c72030] py-1 px-2 rounded ${conversation.id === Number(id) ? "text-[#c72030]" : ""
//                                                 }`}
//                                             key={conversation.id}
//                                             onClick={() =>
//                                                 navigate(`/channels/messages/${conversation.id}`)
//                                             }
//                                         >
//                                             {displayedName}
//                                         </div>
//                                     );
//                                 })
//                             ) : (
//                                 <div className="text-sm text-gray-700 cursor-pointer hover:text-[#c72030] py-1 px-2 rounded">
//                                     No conversations found
//                                 </div>
//                             )
//                         }
//                     </div>
//                 )}
//             </div>

//             <div>
//                 <button
//                     className="flex items-center justify-between cursor-pointer hover:bg-gray-100 py-2 px-3 w-full"
//                     onClick={() => setIsGroupsOpen(!isGroupsOpen)}
//                 >
//                     <span className="text-sm font-medium">Groups</span>
//                     {isGroupsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//                 </button>

//                 {isGroupsOpen && (
//                     <div className="pl-6 space-y-1 max-h-[15rem] overflow-auto">
//                         {
//                             filteredGroups.length > 0 ? (
//                                 filteredGroups.map((group) => (
//                                     <div
//                                         className={`text-sm text-gray-700 cursor-pointer hover:bg-gray-50 py-1 px-2 rounded ${group.id === Number(id) ? "text-[#c72030]" : ""
//                                             }`}
//                                         key={group.id}
//                                         onClick={() => navigate(`/channels/groups/${group.id}`)}
//                                     >
//                                         {group.name}
//                                     </div>
//                                 ))
//                             ) : (
//                                 <div className="text-sm text-gray-700 cursor-pointer hover:text-[#c72030] py-1 px-2 rounded">
//                                     No groups found
//                                 </div>
//                             )
//                         }
//                     </div>
//                 )}
//             </div>

//             {/* {newConversationModal && (
//                 <NewConversationModal
//                     modalRef={modalRef}
//                     filteredUsers={filteredUsers}
//                     searchQuery={searchQuery}
//                     setSearchQuery={setSearchQuery}
//                     setNewConversationModal={setNewConversationModal}
//                     conversations={conversations}
//                 />
//             )} */}
//         </div>
//     );
// };

// export default ChannelSidebar;
