import { useState } from 'react';
import Table from '../../components/Setup/Shift/Table';

const Shift = () => {
    const [openModal, setOpenModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    return (
        <div className="flex flex-col gap-2 p-5 text-[14px]">
            <div className="flex justify-end ">
                <button className="h-[38px] w-[170px] bg-[#C72030] text-white mr-5" onClick={() => { setOpenModal(true); setEditMode(false) }}>+ Add Shift</button>
            </div>
            <Table openModal={openModal} setOpenModal={setOpenModal} editMode={editMode} setEditMode={setEditMode} />
        </div>
    )
}

export default Shift;