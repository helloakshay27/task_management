import { useState } from 'react';
import DepartmentTable from '../../components/Setup/Department/Table';

const Department = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  return (
    <div className="flex flex-col gap-2 p-5 text-[14px] ">
      <div className="flex justify-end ">
        <button
          className="h-[38px] w-[170px] bg-[#C72030] text-white mr-5"
          onClick={() => {
            setOpenModal(true);
            setEditMode(false);
          }}
        >
          + Add Department
        </button>
      </div>
      <DepartmentTable
        openModal={openModal}
        setOpenModal={setOpenModal}
        editMode={editMode}
        setEditMode={setEditMode}
      />
    </div>
  );
};

export default Department;
