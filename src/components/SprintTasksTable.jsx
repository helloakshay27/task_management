import { fetchSpirintById } from '@/redux/slices/spirintSlice';
import { editTask } from '@/redux/slices/taskSlice';
import { fetchUsers } from '@/redux/slices/userSlice';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

const mapStatusToDisplay = (rawStatus) => {
    const statusMap = {
        open: "Open",
        in_progress: "In Progress",
        on_hold: "On Hold",
        overdue: "Overdue",
        completed: "Completed",
    };
    return statusMap[rawStatus?.toLowerCase()] || "Open";
};

const statusOptions = ['Open', 'In Progress', 'Completed', 'On Hold'];

const SprintTasksTable = ({ sprint }) => {
    console.log(sprint)
    const dispatch = useDispatch();
    const token = localStorage.getItem('token');
    const tableRef = useRef(null);

    const [userOptions, setUserOptions] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [editData, setEditData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [openOwnerDropdown, setOpenOwnerDropdown] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({
        title: '',
        status: 'Open',
        responsible_person_id: '',
        responsible_person_name: '',
        priority: "",
        start_date: '',
        end_date: ''
    });

    const getUsers = async () => {
        try {
            const response = await dispatch(fetchUsers({ token })).unwrap();
            setUserOptions(response);
        } catch (error) {
            console.log(error);
            toast.error('Failed to fetch users');
        }
    };

    useEffect(() => {
        getUsers();
    }, []);

    useEffect(() => {
        if (sprint.sprint_tasks) {
            setTasks(sprint.sprint_tasks)
        }
    }, [sprint.sprint_tasks])

    const handleAddTask = () => {
        console.log("clicked")
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isSaving) {
            if (isAddingNew) {
                handleAddTask()
            } else if (editingId) {
                saveEditing();
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tableRef.current && !tableRef.current.contains(event.target)) {
                // Save editing row if there's one in progress
                if (editingId) {
                    saveEditing();
                }
                // Save new milestone if being added
                if (isAddingNew) {
                    handleAddTask();
                }
                // Close dropdowns
                setOpenDropdown(null);
                setOpenOwnerDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingId, isAddingNew, editData, newTask, isSaving]);

    const getDurationColor = (duration) => {
        return 'text-gray-800';
    };

    const calculateDuration = (start, end) => {
        const now = new Date(); // gets updated every second due to currentTime state
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate) || isNaN(endDate)) return "";

        // Set end date to end of the day
        endDate.setHours(23, 59, 59, 999);

        // Check if task hasn't started yet
        if (now < startDate) {
            return "Not started";
        }

        // Check if task has already ended
        const diffMs = endDate - now;
        if (diffMs <= 0) return "0s";

        // Calculate time differences
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const remainingHours = hours % 24;
        const remainingMinutes = minutes % 60;
        const remainingSeconds = seconds % 60;

        return `${days > 0 ? days + "d " : ""}${remainingHours > 0 ? remainingHours + "h " : ""}${remainingMinutes > 0 ? remainingMinutes + "m " : ""}${remainingSeconds}s`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-red-500';
            case 'In Progress': return 'bg-yellow-500';
            case 'Completed': return 'bg-green-500';
            case 'On Hold': return 'bg-gray-500';
            default: return 'bg-red-500';
        }
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const startEditing = (milestone) => {
        setEditingId(milestone.id);
        setEditData({ ...milestone });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditData({});
        setOpenOwnerDropdown(null);
        setOpenDropdown(null);
    };

    const getDropdownPosition = (event) => {
        if (!event.currentTarget) return { top: 0, left: 0, direction: 'down' };
        const rect = event.currentTarget.getBoundingClientRect();
        const dropdownHeight = 150; // approximate dropdown height
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If there's not enough space below, open upward
        const openUpward = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

        return {
            top: openUpward ? rect.top + window.scrollY - dropdownHeight : rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            direction: openUpward ? 'up' : 'down'
        };
    };

    const saveEditing = async () => {
        console.log(editData)
        if (!editData.title || !editData.responsible_person_id || !editData.expected_start_date || !editData.target_date) {
            toast.error('Please fill all required fields');
            return;
        }

        setIsSaving(true);
        const payload = {
            title: editData.title,
            status: editData.status,
            responsible_person_id: editData.responsible_person_id,
            expected_start_date: editData.expected_start_date,
            target_date: editData.target_date,
        };

        console.log(payload)

        try {
            await dispatch(editTask({ token, id: editData.id, payload })).unwrap();
            toast.success('Task updated successfully');
            dispatch(fetchSpirintById({ token, id: sprint.id }));
            cancelEditing();
        } catch (error) {
            toast.error('Failed to update milestone');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    console.log(editData)

    return (
        <div className="w-full">
            <div ref={tableRef} className="bg-white shadow-sm overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Task Title</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Status</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Responsible Person</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Start Date</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">End Date</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Duration</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50">
                                {editingId === task.task_management.id ? (
                                    <>
                                        {/* Editing Row */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={cancelEditing}
                                                    disabled={isSaving}
                                                    className="text-red-500 hover:text-red-700 text-lg font-bold disabled:opacity-50"
                                                >
                                                    ✕
                                                </button>
                                                <input
                                                    type="text"
                                                    value={editData.title}
                                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                                    onKeyPress={handleKeyPress}
                                                    disabled={isSaving}
                                                    className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        const pos = getDropdownPosition(e);
                                                        setDropdownPos(pos);
                                                        setOpenDropdown(openDropdown === task.task_management.id ? null : task.task_management.id);
                                                    }}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-1 rounded disabled:opacity-50"
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(editData.status)}`}></span>
                                                    <span className="text-gray-800">{editData.status}</span>
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                </button>
                                                {openDropdown === task.task_management.id && (
                                                    <div className="fixed bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[150px]" style={{ top: dropdownPos.top, left: dropdownPos.left }}>
                                                        {statusOptions.map(status => (
                                                            <button
                                                                key={status}
                                                                onClick={() => {
                                                                    setEditData({ ...editData, status });
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 text-left"
                                                            >
                                                                <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></span>
                                                                <span className="text-gray-800">{status}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="!px-6 py-4">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        const pos = getDropdownPosition(e);
                                                        setDropdownPos(pos);
                                                        setOpenOwnerDropdown(openOwnerDropdown === task.task_management.id ? null : task.task_management.id);
                                                    }}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-1 rounded border border-gray-300 bg-white w-full justify-between disabled:opacity-50"
                                                >
                                                    <span className="text-gray-800">{editData?.responsible_person?.name}</span>
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                </button>
                                                {openOwnerDropdown === task.task_management.id && (
                                                    <div className="fixed bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col max-h-[150px] overflow-y-auto" style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
                                                        {userOptions.map(user => (
                                                            <button
                                                                key={user.id}
                                                                onClick={() => {
                                                                    setEditData({
                                                                        ...editData,
                                                                        responsible_person: {
                                                                            name: user.firstname + ' ' + user.lastname
                                                                        },
                                                                        responsible_person_id: user.id
                                                                    });
                                                                    setOpenOwnerDropdown(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-sm hover:bg-gray-100 text-left text-gray-800"
                                                            >
                                                                {user.firstname + ' ' + user.lastname}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="date"
                                                value={editData.expected_start_date?.split('T')[0] || ''}
                                                onChange={(e) => setEditData({ ...editData, expected_start_date: e.target.value })}
                                                onKeyPress={handleKeyPress}
                                                // min={effectiveStartDate.toISOString().split('T')[0]}
                                                // max={projectDetail?.end_date?.split('T')[0]}
                                                disabled={isSaving}
                                                className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="date"
                                                value={editData.target_date?.split('T')[0] || ''}
                                                onChange={(e) => setEditData({ ...editData, target_date: e.target.value })}
                                                onKeyPress={handleKeyPress}
                                                // min={editData.start_date || effectiveStartDate.toISOString().split('T')[0]}
                                                // max={projectDetail?.end_date?.split('T')[0]}
                                                disabled={isSaving}
                                                className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${getDurationColor(calculateDuration(editData.expected_start_date, editData.target_date))}`}>
                                                    {calculateDuration(editData.expected_start_date, editData.target_date)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">

                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {/* View Row */}
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => startEditing(task.task_management)}>
                                            <span className="text-gray-800 text-sm">{task.task_management.title}</span>
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => startEditing(task.task_management)}>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className={`w-2 h-2 rounded-full ${getStatusColor(task.task_management.status)}`}></span>
                                                <span className="text-gray-800">{mapStatusToDisplay(task.task_management.status)}</span>
                                            </div>
                                        </td>
                                        <td className="!px-6 py-4 text-gray-800 text-sm cursor-pointer" onClick={() => startEditing(task.task_management)}>
                                            {task?.task_management?.responsible_person?.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 text-sm cursor-pointer" onClick={() => startEditing(task.task_management)}>
                                            {formatDisplayDate(task.task_management.expected_start_date?.split('T')[0])}
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 text-sm cursor-pointer" onClick={() => startEditing(task.task_management)}>
                                            {formatDisplayDate(task.task_management.target_date?.split('T')[0])}
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => startEditing(task.task_management)}>
                                            <span className={`text-sm font-medium ${getDurationColor(task.task_management.duration)}`}>
                                                {calculateDuration(task.task_management.expected_start_date, task.task_management.target_date)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 text-sm cursor-pointer" onClick={() => startEditing(task.task_management)}>
                                            {task?.task_management?.priority}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {isAddingNew ? (
                            <tr className="border-b border-gray-200 bg-blue-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setIsAddingNew(false);
                                                setNewTask({
                                                    title: '',
                                                    status: 'Open',
                                                    owner_name: '',
                                                    owner_id: '',
                                                    start_date: '',
                                                    end_date: ''
                                                });
                                                setOpenOwnerDropdown(null);
                                            }}
                                            disabled={isSaving}
                                            className="text-red-500 hover:text-red-700 text-lg font-bold disabled:opacity-50"
                                        >
                                            ✕
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Enter task title"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            onKeyPress={handleKeyPress}
                                            disabled={isSaving}
                                            className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        <span className="text-gray-800 text-sm">Open</span>
                                    </div>
                                </td>
                                <td className="!px-6 py-4">
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                const pos = getDropdownPosition(e);
                                                setDropdownPos(pos);
                                                setOpenOwnerDropdown(openOwnerDropdown === 'new' ? null : 'new');
                                            }}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-1 rounded border border-gray-300 bg-white w-full justify-between disabled:opacity-50"
                                        >
                                            <span className="text-gray-800">{newTask.responsible_person_name || 'Select responsible person'}</span>
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </button>
                                        {openOwnerDropdown === 'new' && (
                                            <div className="fixed bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col max-h-[150px] overflow-y-auto" style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
                                                {userOptions.map(user => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => {
                                                            setNewTask({
                                                                ...newTask,
                                                                responsible_person_name: user.firstname + ' ' + user.lastname,
                                                                responsible_person_id: user.id
                                                            });
                                                            setOpenOwnerDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm hover:bg-gray-100 text-left text-gray-800"
                                                    >
                                                        {user.firstname + ' ' + user.lastname}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="date"
                                        value={newTask.start_date}
                                        onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                                        onKeyPress={handleKeyPress}
                                        // min={effectiveStartDate.toISOString().split('T')[0]}
                                        // max={projectDetail?.end_date?.split('T')[0]}
                                        disabled={isSaving}
                                        className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="date"
                                        value={newTask.end_date}
                                        // min={newTask.start_date || effectiveStartDate.toISOString().split('T')[0]}
                                        // max={projectDetail?.end_date?.split('T')[0]}
                                        onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                                        onKeyPress={handleKeyPress}
                                        disabled={isSaving}
                                        className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-medium ${getDurationColor(calculateDuration(newTask.start_date, newTask.end_date))}`}>
                                        {calculateDuration(newTask.start_date, newTask.end_date)}
                                    </span>
                                </td>
                            </tr>
                        ) : (
                            // <tr className="border-b border-gray-200">
                            //     <td className="px-6 py-4" colSpan="6">
                            //         <button
                            //             onClick={() => setIsAddingNew(true)}
                            //             className="flex items-center gap-2 text-gray-400 text-sm hover:text-gray-600"
                            //         >
                            //             <span>Add Task title</span>
                            //         </button>
                            //     </td>
                            // </tr>
                            <></>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SprintTasksTable