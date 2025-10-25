import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const MilestoneDependencyTable = () => {
    const [milestones, setMilestones] = useState([
        {
            id: 1,
            title: 'Stakeholders Interviews, Research, Inspirations & Benchmarking',
            status: 'Open',
            owner: 'Kshitij Rasal',
            startDate: '01 Jan 2025',
            endDate: '15 Jan 2025',
            duration: '15 d : 360 h : 00 m : 00'
        },
        {
            id: 2,
            title: 'Workshops with Core Team & SFDC',
            status: 'Open',
            owner: 'Kshitij Rasal',
            startDate: '16 Jan 2025',
            endDate: '25 Jan 2025',
            duration: '10 d : 240 h : 00 m : 00'
        }
    ]);

    const [openDropdown, setOpenDropdown] = useState(null);
    const statusOptions = ['Open', 'In Progress', 'Completed', 'On Hold'];

    const [newMilestone, setNewMilestone] = useState({
        title: '',
        status: 'Open',
        owner: '',
        startDate: '',
        endDate: ''
    });

    const [isAddingNew, setIsAddingNew] = useState(false);

    const calculateDuration = (start, end) => {
        if (!start || !end) return '0 d : 0 h : 00 m : 00';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const diffHours = diffDays * 24;
        return `${diffDays} d : ${diffHours} h : 00 m : 00`;
    };

    const getDurationColor = (duration) => {
        const days = parseInt(duration.split(' ')[0]);
        if (days >= 15) return 'text-emerald-500';
        return 'text-teal-500';
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

    const handleStatusChange = (milestoneId, newStatus) => {
        setMilestones(milestones.map(m =>
            m.id === milestoneId ? { ...m, status: newStatus } : m
        ));
        setOpenDropdown(null);
    };

    const handleAddMilestone = () => {
        if (newMilestone.title && newMilestone.owner && newMilestone.startDate && newMilestone.endDate) {
            const duration = calculateDuration(newMilestone.startDate, newMilestone.endDate);
            setMilestones([...milestones, {
                id: milestones.length + 1,
                ...newMilestone,
                duration
            }]);
            setNewMilestone({
                title: '',
                status: 'Open',
                owner: '',
                startDate: '',
                endDate: ''
            });
            setIsAddingNew(false);
        }
    };

    return (
        <div className="w-full">
            <div className="bg-white shadow-sm overflow-x-auto">
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
                        {milestones.map((milestone, index) => (
                            <tr key={milestone.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">::</span>
                                        <span className="text-gray-800 text-sm">{milestone.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === milestone.id ? null : milestone.id)}
                                            className="flex items-center gap-2 text-sm hover:bg-gray-100 px-2 py-1 rounded"
                                        >
                                            <span className={`w-2 h-2 rounded-full ${getStatusColor(milestone.status)}`}></span>
                                            <span className="text-gray-800">{milestone.status}</span>
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </button>
                                        {openDropdown === milestone.id && (
                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[150px]">
                                                {statusOptions.map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(milestone.id, status)}
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
                                <td className="!px-6 py-4 text-gray-800 text-sm">{milestone.owner}</td>
                                <td className="px-6 py-4 text-gray-800 text-sm">{milestone.startDate}</td>
                                <td className="px-6 py-4 text-gray-800 text-sm">{milestone.endDate}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-medium ${getDurationColor(milestone.duration)}`}>
                                        {milestone.duration}
                                    </span>
                                </td>
                            </tr>
                        ))}

                        {isAddingNew ? (
                            <tr className="border-b border-gray-200 bg-blue-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">::</span>
                                        <input
                                            type="text"
                                            placeholder="Enter milestone title"
                                            value={newMilestone.title}
                                            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                            className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        <span className="text-gray-800 text-sm">Open</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        placeholder="Owner name"
                                        value={newMilestone.owner}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, owner: e.target.value })}
                                        className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="date"
                                        value={newMilestone.startDate}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, startDate: e.target.value })}
                                        className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="date"
                                        value={newMilestone.endDate}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, endDate: e.target.value })}
                                        className="text-gray-800 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddMilestone}
                                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setIsAddingNew(false)}
                                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <tr className="border-b border-gray-200">
                                <td className="px-6 py-4" colSpan="6">
                                    <button
                                        onClick={() => setIsAddingNew(true)}
                                        className="flex items-center gap-2 text-gray-400 text-sm hover:text-gray-600"
                                    >
                                        <span className="text-gray-400">::</span>
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