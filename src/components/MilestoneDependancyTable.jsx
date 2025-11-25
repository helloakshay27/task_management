import { useEffect, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDependentMilestone, updateMilestone, createMilestone } from '../redux/slices/milestoneSlice';
import { useParams } from 'react-router-dom';
import { fetchUsers } from '../redux/slices/userSlice';
import toast from 'react-hot-toast';
import { fetchProjectDetails } from '../redux/slices/projectSlice';

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

const MilestoneDependencyTable = () => {
    const { id, mid } = useParams();
    const dispatch = useDispatch();
    const token = localStorage.getItem('token');
    const tableRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const { fetchProjectDetails: projectDetail } = useSelector(
        (state) => state.fetchProjectDetails
    );

    const projectStart = new Date(projectDetail?.start_date);
    const projectEnd = new Date(projectDetail?.end_date);
    const today = new Date();

    // ⏰ Determine effective min start date
    const effectiveStartDate = projectStart > today ? projectStart : today;

    const [milestones, setMilestones] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openOwnerDropdown, setOpenOwnerDropdown] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [userOptions, setUserOptions] = useState([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newMilestone, setNewMilestone] = useState({
        title: '',
        status: 'Open',
        owner_name: '',
        owner_id: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        dispatch(fetchProjectDetails({ token, id: id }));
    }, [])

    // Handle clicks outside the table
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tableRef.current && !tableRef.current.contains(event.target)) {
                // Save editing row if there's one in progress
                if (editingId) {
                    saveEditing();
                }
                // Save new milestone if being added
                if (isAddingNew) {
                    handleAddMilestone();
                }
                // Close dropdowns
                setOpenDropdown(null);
                setOpenOwnerDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingId, isAddingNew, editData, newMilestone, isSaving]);

    // 🔥 Live countdown trigger
    const [currentTime, setCurrentTime] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const statusOptions = ['Open', 'In Progress', 'Completed', 'On Hold'];

    useEffect(() => {
        getDependentMilestones();
        getUsers();
    }, []);

    const getDependentMilestones = async () => {
        try {
            const response = await dispatch(fetchDependentMilestone({ token, id: mid })).unwrap();
            setMilestones(response);
        } catch (error) {
            console.log(error);
            toast.error('Failed to fetch milestones');
        }
    };

    const getUsers = async () => {
        try {
            const response = await dispatch(fetchUsers({ token })).unwrap();
            setUserOptions(response);
        } catch (error) {
            console.log(error);
            toast.error('Failed to fetch users');
        }
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // 🔥 Countdown logic (auto-updated)
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

    const getDurationColor = (duration) => {
        return 'text-gray-800';
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

    const saveEditing = async () => {
        if (!editData.title || !editData.owner_id || !editData.start_date || !editData.end_date) {
            toast.error('Please fill all required fields');
            return;
        }

        setIsSaving(true);
        const payload = {
            milestone: {
                title: editData.title,
                status: editData.status,
                owner_id: editData.owner_id,
                start_date: editData.start_date,
                end_date: editData.end_date,
                depends_on_id: mid,
            }
        };

        try {
            await dispatch(updateMilestone({ token, id: editData.id, payload })).unwrap();
            toast.success('Milestone updated successfully');
            await getDependentMilestones();
            cancelEditing();
        } catch (error) {
            toast.error('Failed to update milestone');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddMilestone = async () => {
        if (!newMilestone.title || !newMilestone.owner_id || !newMilestone.start_date || !newMilestone.end_date) {
            toast.error('Please fill all required fields');
            return;
        }

        setIsSaving(true);
        const payload = {
            milestone: {
                title: newMilestone.title,
                status: "open",
                owner_id: newMilestone.owner_id,
                start_date: newMilestone.start_date,
                end_date: newMilestone.end_date,
                depends_on_id: mid,
                project_management_id: id,
            }
        };

        try {
            await dispatch(createMilestone({ token, payload })).unwrap();
            toast.success('Milestone created successfully');
            await getDependentMilestones();
            setNewMilestone({
                title: '',
                status: 'open',
                owner_name: '',
                owner_id: '',
                start_date: '',
                end_date: ''
            });
            setIsAddingNew(false);
            setOpenOwnerDropdown(null);
        } catch (error) {
            toast.error('Failed to create milestone');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isSaving) {
            if (isAddingNew) {
                handleAddMilestone();
            } else if (editingId) {
                saveEditing();
            }
        }
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

    return (
        <div className="w-full">
            <div ref={tableRef} className="bg-white shadow-sm overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Milestone Title</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Status</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Milestone Owner</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Start Date</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">End Date</th>
                            <th className="text-left px-6 py-3 text-gray-700 font-medium text-sm">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {milestones.map((milestone) => (
                            <tr key={milestone.id} className="border-b border-gray-200 hover:bg-gray-50">
                                {editingId === milestone.id ? (
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
                                                        setOpenDropdown(openDropdown === milestone.id ? null : milestone.id);
                                                    }}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-1 rounded disabled:opacity-50"
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(editData.status)}`}></span>
                                                    <span className="text-gray-800">{editData.status}</span>
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                </button>
                                                {openDropdown === milestone.id && (
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
                                                        setOpenOwnerDropdown(openOwnerDropdown === milestone.id ? null : milestone.id);
                                                    }}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-1 rounded border border-gray-300 bg-white w-full justify-between disabled:opacity-50"
                                                >
                                                    <span className="text-gray-800">{editData.owner_name}</span>
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                </button>
                                                {openOwnerDropdown === milestone.id && (
                                                    <div className="fixed bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col max-h-[150px] overflow-y-auto" style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
                                                        {userOptions ? userOptions.map(user => (
                                                            <button
                                                                key={user.id}
                                                                onClick={() => {
                                                                    setEditData({
                                                                        ...editData,
                                                                        owner_name: user.firstname + ' ' + user.lastname,
                                                                        owner_id: user.id
                                                                    });
                                                                    setOpenOwnerDropdown(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-sm hover:bg-gray-100 text-left text-gray-800"
                                                            >
                                                                {user.firstname + ' ' + user.lastname}
                                                            </button>
                                                        )) : <span className="w-full px-4 py-2 text-sm hover:bg-gray-100 text-left text-gray-800">No users found</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="date"
                                                value={editData.start_date?.split('T')[0] || ''}
                                                onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                                                onKeyPress={handleKeyPress}
                                                min={effectiveStartDate.toISOString().split('T')[0]}
                                                max={projectDetail?.end_date?.split('T')[0]}
                                                disabled={isSaving}
                                                className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="date"
                                                value={editData.end_date?.split('T')[0] || ''}
                                                onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                                                onKeyPress={handleKeyPress}
                                                min={editData.start_date || effectiveStartDate.toISOString().split('T')[0]}
                                                max={projectDetail?.end_date?.split('T')[0]}
                                                disabled={isSaving}
                                                className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${getDurationColor(calculateDuration(editData.start_date, editData.end_date))}`}>
                                                    {calculateDuration(editData.start_date, editData.end_date)}
                                                </span>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {/* View Row */}
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => startEditing(milestone)}>
                                            <span className="text-gray-800 text-sm">{milestone.title}</span>
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => startEditing(milestone)}>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className={`w-2 h-2 rounded-full ${getStatusColor(milestone.status)}`}></span>
                                                <span className="text-gray-800">{mapStatusToDisplay(milestone.status)}</span>
                                            </div>
                                        </td>
                                        <td className="!px-6 py-4 text-gray-800 text-sm cursor-pointer" onClick={() => startEditing(milestone)}>
                                            {milestone.owner_name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 text-sm cursor-pointer" onClick={() => startEditing(milestone)}>
                                            {formatDisplayDate(milestone.start_date?.split('T')[0])}
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 text-sm cursor-pointer" onClick={() => startEditing(milestone)}>
                                            {formatDisplayDate(milestone.end_date?.split('T')[0])}
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => startEditing(milestone)}>
                                            <span className={`text-sm font-medium ${getDurationColor(milestone.duration)}`}>
                                                {calculateDuration(milestone.start_date, milestone.end_date)}
                                            </span>
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
                                                setNewMilestone({
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
                                            placeholder="Enter milestone title"
                                            value={newMilestone.title}
                                            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
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
                                            <span className="text-gray-800">{newMilestone.owner_name || 'Select owner'}</span>
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </button>
                                        {openOwnerDropdown === 'new' && (
                                            <div className="fixed bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col max-h-[150px] overflow-y-auto" style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
                                                {userOptions ? userOptions.map(user => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => {
                                                            setNewMilestone({
                                                                ...newMilestone,
                                                                owner_name: user.firstname + ' ' + user.lastname,
                                                                owner_id: user.id
                                                            });
                                                            setOpenOwnerDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm hover:bg-gray-100 text-left text-gray-800"
                                                    >
                                                        {user.firstname + ' ' + user.lastname}
                                                    </button>
                                                )) : <div className="w-full px-4 py-2 text-sm text-left text-gray-800">No users found</div>}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="date"
                                        value={newMilestone.start_date}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, start_date: e.target.value })}
                                        onKeyPress={handleKeyPress}
                                        min={effectiveStartDate.toISOString().split('T')[0]}
                                        max={projectDetail?.end_date?.split('T')[0]}
                                        disabled={isSaving}
                                        className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="date"
                                        value={newMilestone.end_date}
                                        min={newMilestone.start_date || effectiveStartDate.toISOString().split('T')[0]}
                                        max={projectDetail?.end_date?.split('T')[0]}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, end_date: e.target.value })}
                                        onKeyPress={handleKeyPress}
                                        disabled={isSaving}
                                        className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full disabled:opacity-50"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-medium ${getDurationColor(calculateDuration(newMilestone.start_date, newMilestone.end_date))}`}>
                                        {calculateDuration(newMilestone.start_date, newMilestone.end_date)}
                                    </span>
                                </td>
                            </tr>
                        ) : (
                            <tr className="border-b border-gray-200">
                                <td className="px-6 py-4" colSpan="6">
                                    <button
                                        onClick={() => setIsAddingNew(true)}
                                        className="flex items-center gap-2 text-gray-400 text-sm hover:text-gray-600"
                                    >
                                        <span>Add Milestone title</span>
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MilestoneDependencyTable;
