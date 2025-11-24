import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { baseURL } from "../../../apiDomain";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { fetchShift } from "@/redux/slices/shiftSlice";
import { useDispatch } from "react-redux";
import { fetchUsers } from "@/redux/slices/userSlice";

const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
);

const InfoField = ({ label, value, variant = "text" }) => {
    if (variant === "badge") {
        return (
            <div>
                <label className="text-sm text-gray-600 block mb-1">{label}</label>
                <div className="flex flex-wrap gap-2">
                    {Array.isArray(value) ? (
                        value.length > 0 ? (
                            value.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="bg-red-600 text-white px-3 py-1 rounded-full text-xs"
                                >
                                    {item}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 text-sm">N/A</span>
                        )
                    ) : (
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                            {value}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <label className="text-sm text-gray-600 block mb-1">{label}</label>
            <p className="text-gray-900 font-medium">{value || "N/A"}</p>
        </div>
    );
};

const RosterDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [users, setUsers] = useState([])
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rosterTemplate, setRosterTemplate] = useState(null);

    useEffect(() => {
        const fetchRosterDetails = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${baseURL}/user_roasters/${id}.json`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Fetched roster details:", data);
                setRosterTemplate(data);
            } catch (error) {
                console.error("Error fetching roster details:", error);
                toast.error("Failed to load roster details");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        const fetchShifts = async () => {
            try {
                const response = await dispatch(fetchShift({ token })).unwrap();
                console.log("Shifts API Response:", response);

                const shiftsData = response.user_shifts
                setShifts(
                    shiftsData.map((shift) => ({
                        id: shift.id,
                        start_hour: shift.start_hour,
                        start_min: shift.start_min,
                        end_hour: shift.end_hour,
                        end_min: shift.end_min,
                        timings: shift.timings,
                        total_hour: shift.total_hour,
                    }))
                );
            } catch (error) {
                console.error("Error fetching shifts:", error);
                toast.error("Failed to load shifts");
                setShifts([]);
            }
        };

        const getUsers = async () => {
            try {
                const response = await dispatch(fetchUsers({ token })).unwrap();
                setUsers(response);
            } catch (error) {
                console.log(error)
            }
        }

        if (id) {
            fetchRosterDetails();
            fetchShifts();
            getUsers();
        }
    }, [id, token, navigate]);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-2">
                    <CircularProgress />
                    <p className="text-gray-600">Loading roster details...</p>
                </div>
            </div>
        );
    }

    if (!rosterTemplate) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <p className="text-gray-600">No data available</p>
            </div>
        );
    }

    const getDayTypeDisplay = () => {
        const dayType = rosterTemplate.roaster_type;
        if (dayType === "Weekdays") return "Weekdays (Monday - Friday)";
        if (dayType === "Weekends") return "Weekends (Saturday - Sunday)";
        if (dayType === "Recurring") return "Recurring (Custom)";
        return dayType;
    };

    const getWeekSelectionDisplay = () => {
        if (!rosterTemplate || !rosterTemplate.no_of_days) return [];

        if (rosterTemplate.roaster_type === 'Recurring') {
            if (Array.isArray(rosterTemplate.no_of_days) && rosterTemplate.no_of_days.length > 0) {
                const recurringData = rosterTemplate.no_of_days[0];
                return Object.keys(recurringData).map(weekNum => `Week ${weekNum}`);
            }
        } else if (rosterTemplate.roaster_type === 'Weekdays') {
            if (Array.isArray(rosterTemplate.no_of_days)) {
                return rosterTemplate.no_of_days.map((weekNum) =>
                    `${weekNum}${weekNum === '1' ? 'st' : weekNum === '2' ? 'nd' : weekNum === '3' ? 'rd' : 'th'} Week`
                );
            }
        } else if (rosterTemplate.roaster_type === 'Weekends') {
            if (Array.isArray(rosterTemplate.no_of_days)) {
                return rosterTemplate.no_of_days.map((weekendNum) =>
                    `${weekendNum}${weekendNum === '1' ? 'st' : weekendNum === '2' ? 'nd' : weekendNum === '3' ? 'rd' : 'th'} Weekend`
                );
            }
        }
        return [];
    };

    const getSelectedShift = () => {
        if (!rosterTemplate || !rosterTemplate.user_shift_id) return null;
        return shifts.find(shift => shift.id === rosterTemplate.user_shift_id);
    };

    const getSelectedDepartments = () => {
        console.log(rosterTemplate)
        if (!rosterTemplate) return [];

        // First try to get from new API response structure
        if (rosterTemplate.departments && Array.isArray(rosterTemplate.departments)) {
            return rosterTemplate.departments.map(dept => ({
                id: dept.id,
                department_name: dept.name
            }));
        }

        // Fallback to old structure
        if (!rosterTemplate.departments) return [];
        const deptIds = Array.isArray(rosterTemplate.departments)
            ? rosterTemplate.departments.map(dept => dept.id)
            : [rosterTemplate.departments.map(dept => dept.id)];
        console.log(deptIds)
        return departments.filter(dept => deptIds.includes(dept.id));
    };

    const getStatus = () => {
        return rosterTemplate.active ? "Active" : "Inactive";
    };

    const getStatusColor = () => {
        return rosterTemplate.active ? "text-green-600" : "text-red-600";
    };

    const getSelectedEmployees = () => {
        if (!rosterTemplate) return [];

        // First try to get from new API response structure
        if (rosterTemplate.employees && Array.isArray(rosterTemplate.employees)) {
            return rosterTemplate.employees.map(emp => ({
                id: emp.id,
                name: emp.name,
                email: emp.email,
                department: undefined // Department info not included in employee object
            }));
        }

        // Fallback to old structure
        if (!rosterTemplate.resource_id) return [];
        const employee = users.find(user => user.id === rosterTemplate.resource_id);
        return employee ? [employee] : [];
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className=" border-b border-gray-200 ">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Back"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">ROSTER TEMPLATE DETAILS</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Calendar className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-600">{rosterTemplate.name}</span>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor()} ${rosterTemplate.active
                                        ? "bg-green-50"
                                        : "bg-red-50"
                                        }`}
                                >
                                    {getStatus()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Basic Information */}
                <div className="rounded-lg border border-gray-200 p-6">
                    <SectionHeader title="Basic Information" icon={<Calendar className="w-5 h-5" />} />
                    <div className="grid grid-cols-3 gap-6">
                        <InfoField label="Template Name" value={rosterTemplate.name} />
                        <InfoField label="Roster Type" value={rosterTemplate.allocation_type || "Permanent"} />
                        <InfoField label="Status" value={getStatus()} />
                    </div>
                </div>

                {/* Working Days Configuration */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <SectionHeader title="Working Days Configuration" icon={<Calendar className="w-5 h-5" />} />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="Day Type" value={getDayTypeDisplay()} />
                        <InfoField
                            label="Frequency"
                            value={getWeekSelectionDisplay()}
                            variant="badge"
                        />
                    </div>
                </div>

                {/* Location & Department */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <SectionHeader title="Location & Department" icon={<MapPin className="w-5 h-5" />} />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="Location" value={rosterTemplate.location} />
                        <InfoField
                            label="Departments"
                            value={getSelectedDepartments().map(dept => dept.department_name)}
                            variant="badge"
                        />
                    </div>
                </div>

                {/* Shift & Employees */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <SectionHeader title="Shift & Employees" icon={<Clock className="w-5 h-5" />} />

                    <div className="mb-8">
                        <label className="text-sm text-gray-600 block mb-2">Assigned Shift</label>
                        <span className="text-gray-900 font-medium">
                            {(rosterTemplate.shift || getSelectedShift()) && (
                                <div className="flex items-center gap-2 p-3 bg-[#f6f4ee] border border-[#D5DbDB] rounded-lg">
                                    <Clock className="w-4 h-4 text-[#C72030]" />
                                    <span className="font-medium text-gray-900">
                                        {rosterTemplate.shift || getSelectedShift()?.timings}
                                    </span>
                                    {getSelectedShift()?.total_hour && (
                                        <span className="text-sm text-gray-600">
                                            ({getSelectedShift()?.total_hour}h)
                                        </span>
                                    )}
                                </div>
                            )}
                            {!rosterTemplate.shift && !getSelectedShift() && (
                                <p className="text-gray-500 italic">No shift assigned</p>
                            )}
                        </span>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 block mb-3">
                            Assigned Employees ({getSelectedEmployees().length})
                        </label>
                        {getSelectedEmployees().length > 0 ? (
                            <div className="space-y-2">
                                {getSelectedEmployees().map((employee, index) => (
                                    <div key={employee.id || index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{employee.name || 'No name available'}</div>
                                            <div className="text-sm text-gray-600">{employee.email}</div>
                                        </div>
                                        {employee.department && (
                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                {employee.department}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No employees assigned</p>
                        )}
                    </div>
                </div>

                {/* Date Range */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <SectionHeader title="Date Range" icon={<Calendar className="w-5 h-5" />} />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField
                            label="Start Date"
                            value={
                                rosterTemplate.start_date
                                    ? new Date(rosterTemplate.start_date).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })
                                    : "N/A"
                            }
                        />
                        <InfoField
                            label="End Date"
                            value={
                                rosterTemplate.end_date
                                    ? new Date(rosterTemplate.end_date).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })
                                    : "N/A"
                            }
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4 pt-6">
                    <Button
                        variant="destructive"
                        onClick={() => navigate(`/setup/roster/edit/${id}`)}
                        className="px-8"
                    >
                        Edit Template
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="px-8"
                    >
                        Back to Roster List
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RosterDetails;
