import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { baseURL } from "../../../apiDomain";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

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
                                    className="bg-red-600 text-white px-3 py-1 rounded-full text-sm"
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
    const { rosterId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [loading, setLoading] = useState(true);
    const [rosterData, setRosterData] = useState(null);

    useEffect(() => {
        const fetchRosterDetails = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${baseURL}/user_roasters/${rosterId}.json`, {
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
                setRosterData(data);
            } catch (error) {
                console.error("Error fetching roster details:", error);
                toast.error("Failed to load roster details");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        if (rosterId) {
            fetchRosterDetails();
        }
    }, [rosterId, token, navigate]);

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

    if (!rosterData) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <p className="text-gray-600">No data available</p>
            </div>
        );
    }

    const getDayTypeDisplay = () => {
        const dayType = rosterData.roaster_type;
        if (dayType === "Weekdays") return "Weekdays (Monday - Friday)";
        if (dayType === "Weekends") return "Weekends (Saturday - Sunday)";
        if (dayType === "Recurring") return "Recurring (Custom)";
        return dayType;
    };

    const getFrequencyDisplay = () => {
        const weekdays = rosterData.weekdays || [];
        const weekends = rosterData.weekends || [];

        if (weekdays.length > 0) {
            return weekdays.map(w => {
                const weeks = ["", "1st Week", "2nd Week", "3rd Week", "4th Week", "5th Week"];
                return weeks[w] || `Week ${w}`;
            });
        }

        if (weekends.length > 0) {
            return weekends.map(w => {
                const weekends_arr = ["", "1st Weekend", "2nd Weekend", "3rd Weekend", "4th Weekend", "5th Weekend"];
                return weekends_arr[w] || `Weekend ${w}`;
            });
        }

        return [];
    };

    const getStatus = () => {
        return rosterData.active ? "Active" : "Inactive";
    };

    const getStatusColor = () => {
        return rosterData.active ? "text-green-600" : "text-red-600";
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
                                <span className="text-sm text-gray-600">{rosterData.name}</span>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor()} ${rosterData.active
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
                        <InfoField label="Template Name" value={rosterData.name} />
                        <InfoField label="Roster Type" value={rosterData.allocation_type || "Permanent"} />
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
                            value={getFrequencyDisplay()}
                            variant="badge"
                        />
                    </div>
                </div>

                {/* Location & Department */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <SectionHeader title="Location & Department" icon={<MapPin className="w-5 h-5" />} />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="Location" value={rosterData.location} />
                        <InfoField
                            label="Departments"
                            value={
                                rosterData.department_names && rosterData.department_names.length > 0
                                    ? rosterData.department_names
                                    : rosterData.department_id || "N/A"
                            }
                            variant="badge"
                        />
                    </div>
                </div>

                {/* Shift & Employees */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <SectionHeader title="Shift & Employees" icon={<Clock className="w-5 h-5" />} />

                    <div className="mb-8">
                        <label className="text-sm text-gray-600 block mb-2">Assigned Shift</label>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-600" />
                                <span className="text-gray-900 font-medium">
                                    {rosterData.shift_timings ? `${rosterData.shift_timings}` : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 block mb-3">
                            Assigned Employees ({rosterData.assigned_employees_count || 0})
                        </label>
                        <div className="space-y-3">
                            {rosterData.assigned_employees && rosterData.assigned_employees.length > 0 ? (
                                rosterData.assigned_employees.map((employee, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm flex-shrink-0">
                                            {employee.name?.charAt(0).toUpperCase() || "E"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-900 font-medium text-sm">{employee.name}</p>
                                            <p className="text-gray-600 text-xs truncate">{employee.email}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No employees assigned</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Date Range */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <SectionHeader title="Date Range" icon={<Calendar className="w-5 h-5" />} />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField
                            label="Start Date"
                            value={
                                rosterData.start_date
                                    ? new Date(rosterData.start_date).toLocaleDateString("en-GB", {
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
                                rosterData.end_date
                                    ? new Date(rosterData.end_date).toLocaleDateString("en-GB", {
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
                        onClick={() => navigate(`/setup/roster/${rosterId}/edit`)}
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
