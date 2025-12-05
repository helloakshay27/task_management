import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchChannels,
  fetchConversations,
  resetstartConversation,
  startConversation,
} from '../../../redux/slices/channelSlice';
import { useNavigate } from 'react-router-dom';
import { fetchUsers } from '../../../redux/slices/userSlice';
import NewConversationModal from './NewConversationModal';

const SideBar = () => {
  const token = localStorage.getItem('token');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const modalRef = useRef(null);

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  const { fetchChannels: channels } = useSelector((state) => state.fetchChannels);
  const { fetchConversations: conversations } = useSelector((state) => state.fetchConversations);
  const { startConversation: newConversation } = useSelector((state) => state.startConversation);
  const { fetchUsers: users } = useSelector((state) => state.fetchUsers);

  const [searchQuery, setSearchQuery] = useState('');
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

  return (
    <div className="w-64 h-full border-r shadow-sm p-4 space-y-6">
      <button
        className="bg-[#C72030] text-white w-full py-3 flex items-center justify-center rounded-sm font-normal hover:bg-red-800"
        onClick={() => setNewConversationModal(true)}
      >
        <Plus size={12} className="mr-2 text-xs" />
        <span className="font-normal text-xs">New Chat</span>
      </button>
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
            <ul className="mt-2 space-y-4 text-gray-800 font-normal">
              {conversations &&
                conversations.map((conversation) => {
                  const displayedName =
                    currentUserId === conversation.sender_id
                      ? conversation.receiver_name
                      : conversation.sender_name;
                  return (
                    <li
                      key={conversation.id}
                      className="text-xs cursor-pointer"
                      onClick={() => navigate(`/channels/messages/${conversation.id}`)}
                    >
                      {displayedName}
                    </li>
                  );
                })}
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
              {channels &&
                channels.map((channel) => (
                  <li
                    key={channel.id}
                    className="text-xs cursor-pointer"
                    onClick={() => navigate(`/channels/groups/${channel.id}`)}
                  >
                    {channel.name}
                  </li>
                ))}
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
