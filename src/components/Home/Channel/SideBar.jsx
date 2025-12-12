import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchChannels,
  fetchConversations,
  resetstartConversation,
  startConversation,
} from '../../../redux/slices/channelSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchUsers } from '../../../redux/slices/userSlice';
import NewConversationModal from './NewConversationModal';

const SideBar = () => {
  const token = localStorage.getItem('token');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const modalRef = useRef(null);

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  const { fetchChannels: channels } = useSelector((state) => state.fetchChannels);
  const { fetchConversations: conversations } = useSelector((state) => state.fetchConversations);
  const { startConversation: newConversation } = useSelector((state) => state.startConversation);
  const { fetchUsers: users } = useSelector((state) => state.fetchUsers);

  const [searchQuery, setSearchQuery] = useState('');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [newConversationModal, setNewConversationModal] = useState(false);
  const [openSections, setOpenSections] = useState({
    dms: true,
    groups: true,
    users: true,
  });

  useEffect(() => {
    dispatch(fetchChannels({ token }));
    dispatch(fetchConversations({ token }));
    dispatch(fetchUsers({ token }));
  }, [dispatch]);

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
      },
    };

    dispatch(startConversation({ token, payload }));
  };

  useEffect(() => {
    if (newConversation && !Array.isArray(newConversation)) {
      navigate(`/channels/chat/${newConversation.id}`);
      dispatch(resetstartConversation());
    }
  }, [newConversation]);

  const filteredUsers = users?.filter(
    (user) =>
      user.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter conversations based on channelSearchQuery
  const filteredConversations = conversations?.filter((conversation) => {
    const displayedName =
      currentUserId === conversation.sender_id
        ? conversation.receiver_name
        : conversation.sender_name;
    return displayedName?.toLowerCase().includes(channelSearchQuery.toLowerCase());
  });

  // Filter channels based on channelSearchQuery
  const filteredChannels = channels?.filter((channel) =>
    channel.name?.toLowerCase().includes(channelSearchQuery.toLowerCase())
  );

  return (
    <div className="w-64 h-full border-r shadow-sm p-4">
      <button
        className="bg-[#C72030] mb-2 text-white w-full py-3 flex items-center justify-center rounded-sm font-normal hover:bg-red-800"
        onClick={() => setNewConversationModal(true)}
      >
        <Plus size={12} className="mr-2 text-xs" />
        <span className="font-normal text-xs">New Chat</span>
      </button>

      {/* Search input for DMs and Groups */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search messages & groups..."
          value={channelSearchQuery}
          onChange={(e) => setChannelSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <div className="flex items-center justify-between cursor-pointer hover:text-gray-600">
            <span className="text-sm font-medium">Home</span>
            <ChevronRight size={16} />
          </div>
        </div>
        <div className="flex items-center justify-between cursor-pointer hover:text-gray-600">
          <span className="text-sm font-medium">Starred</span>
          <ChevronRight size={16} />
        </div>
        <div className="space-y-3">
          <div
            onClick={() => toggleSection('dms')}
            className="flex items-center justify-between cursor-pointer hover:text-gray-600"
          >
            <span className="text-sm font-medium">Direct Messages</span>
            {openSections.dms ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          {openSections.dms && (
            <ul className="mt-2 space-y-4 text-gray-800 font-normal chat-sidebar-scroll">
              {filteredConversations && filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const displayedName =
                    currentUserId === conversation.sender_id
                      ? conversation.receiver_name
                      : conversation.sender_name;

                  // Check if this conversation is currently active
                  const isActive = location.pathname === `/channels/messages/${conversation.id}`;

                  return (
                    <li
                      key={conversation.id}
                      className={`text-xs cursor-pointer px-2 py-1 rounded transition-colors flex items-center justify-between ${isActive
                          ? 'text-red-600 font-semibold'
                          : 'hover:text-red-600'
                        }`}
                      onClick={() => navigate(`/channels/messages/${conversation.id}`)}
                    >
                      <span>{displayedName}</span>
                      {conversation.has_unread && (
                        <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></span>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-gray-400 italic">No conversations found</li>
              )}
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
            <ul className="mt-2 space-y-4 text-gray-800 font-normal chat-sidebar-scroll">
              {filteredChannels && filteredChannels.length > 0 ? (
                filteredChannels.map((channel) => {
                  // Check if this channel is currently active
                  const isActive = location.pathname === `/channels/groups/${channel.id}`;

                  return (
                    <li
                      key={channel.id}
                      className={`text-xs cursor-pointer px-2 py-1 rounded transition-colors flex items-center justify-between ${isActive
                          ? 'text-red-600 font-semibold'
                          : 'hover:text-red-600'
                        }`}
                      onClick={() => navigate(`/channels/groups/${channel.id}`)}
                    >
                      <span>{channel.name}</span>
                      {channel.has_unread && (
                        <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></span>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-gray-400 italic">No groups found</li>
              )}
            </ul>
          )}
        </div>
      </div>

      {newConversationModal && (
        <NewConversationModal
          modalRef={modalRef}
          filteredUsers={filteredUsers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setNewConversationModal={setNewConversationModal}
          conversations={conversations}
        />
      )}
    </div>
  );
};

export default SideBar;
