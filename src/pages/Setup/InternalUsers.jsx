import { useState } from 'react';
import AddEscalationModal from '../../components/Setup/Escalation_Matrix/Modal';
import InternalTable from '../../components/Setup/Internal_Users/Table';
import Modal from '../../components/Setup/Internal_Users/Modal';
import { Search } from 'lucide-react';

const InternalUsers = () => {
  const [openModal, setOpenModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="flex flex-col gap-2 p-10 text-[14px]">
      <div className="flex justify-between ">
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            className="border border-gray-300 ps-10 pe-2 py-2 w-[400px] focus:outline-none"
            placeholder="Search by Title..."
          />
          <Search className="absolute left-2 top-2 text-gray-400" size={20} color="#C72030" />
        </div>
        <button
          className="h-[38px] w-[170px] bg-[#C72030] text-white mr-5"
          onClick={() => {
            setOpenModal(true);
          }}
        >
          + Add User
        </button>
      </div>
      <InternalTable />
    </div>
  );
};

export default InternalUsers;
