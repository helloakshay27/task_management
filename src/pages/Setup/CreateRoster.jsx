import { Label } from "@/components/ui/label";
import { TextField } from "@mui/material";
import { ArrowLeft, Calendar } from "lucide-react"
import { useState } from "react";

const Section = ({ title, icon, children }) => (
    <section className="bg-card border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                {icon}
            </div>
            <h2 className="text-sm font-semibold tracking-wide uppercase">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </section>
);

const fieldStyles = {
    height: { xs: 28, sm: 36, md: 45 },
    "& .MuiInputBase-input, & .MuiSelect-select": {
        padding: { xs: "8px", sm: "10px", md: "12px" },
    },
    backgroundColor: "#fafbfc",
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#e1e5e9",
        borderWidth: "1px",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#9ca3af",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#6b7280",
        borderWidth: "2px",
    },
};

const CreateRoster = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        templateName: "",
        selectedDays: [],
        dayType: "Weekdays",
        weekSelection: [],
        location: "",
        departments: [],
        shift: null,
        selectedEmployees: [],
        rosterType: "Permanent",
    });
    const [errors, setErrors] = useState({
        templateName: false,
        selectedDays: false,
        dayType: false,
        location: false,
        departments: false,
        shift: false,
        selectedEmployees: false,
    });

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear field error when user starts typing/selecting
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: false }));
        }

        // If department selection changes, fetch filtered employees
        if (field === "departments") {
            fetchFilteredFMUsers(value);
            // Clear selected employees when departments change
            setFormData((prev) => ({
                ...prev,
                selectedEmployees: [],
            }));
            // Clear employee selection error
            setErrors((prev) => ({ ...prev, selectedEmployees: false }));
        }
    };

    const handleDayTypeChange = (type) => {
        setFormData((prev) => ({
            ...prev,
            dayType: type,
            selectedDays: [],
            weekSelection: [],
        }));

        // Clear day error when user selects a type
        if (errors.selectedDays) {
            setErrors((prev) => ({ ...prev, selectedDays: false }));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Back to Roster Management"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C72030]/10 text-[#C72030] flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wide uppercase">
                                Create Roster Template
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="space-y-6">
                <Section
                    title="Basic Information"
                    icon={<Calendar className="w-4 h-4" />}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <TextField
                                label={
                                    <>
                                        Template Name<span className="text-red-500">*</span>
                                    </>
                                }
                                placeholder="Enter template name"
                                value={formData.templateName}
                                onChange={(e) =>
                                    handleInputChange("templateName", e.target.value)
                                }
                                fullWidth
                                variant="outlined"
                                error={errors.templateName}
                                helperText={
                                    errors.templateName ? "Template name is required" : ""
                                }
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                InputProps={{
                                    sx: { ...fieldStyles, backgroundColor: "#fff" },
                                }}
                            />
                        </div>

                        <div>
                            <TextField
                                label="Roster Type"
                                value="Permanent"
                                disabled
                                fullWidth
                                variant="outlined"
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                InputProps={{
                                    sx: { ...fieldStyles, backgroundColor: "#fff" },
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-4 block mt-6">
                            Working Days <span className="text-red-500">*</span>
                        </Label>

                        <div className="mb-4">
                            <div className="flex flex-wrap gap-6">
                                {/* Weekdays Option */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dayType"
                                        checked={formData.dayType === "Weekdays"}
                                        onChange={() => handleDayTypeChange("Weekdays")}
                                        className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030] focus:ring-2"
                                        style={{
                                            accentColor: "#C72030",
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <span className="font-medium text-gray-800">Weekdays</span>
                                    <span className="text-sm text-gray-500">(Mon-Fri)</span>
                                </label>

                                {/* Weekends Option */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dayType"
                                        checked={formData.dayType === "Weekends"}
                                        onChange={() => handleDayTypeChange("Weekends")}
                                        className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030] focus:ring-2"
                                        style={{
                                            accentColor: "#C72030",
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <span className="font-medium text-gray-800">Weekends</span>
                                    <span className="text-sm text-gray-500">(Sat-Sun)</span>
                                </label>

                                {/* Recurring Option */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dayType"
                                        checked={formData.dayType === "Recurring"}
                                        onChange={() => handleDayTypeChange("Recurring")}
                                        className="w-4 h-4 text-[#C72030] border-gray-300 focus:ring-[#C72030] focus:ring-2"
                                        style={{
                                            accentColor: "#C72030",
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <span className="font-medium text-gray-800">Recurring</span>
                                    <span className="text-sm text-gray-500">(Custom)</span>
                                </label>
                            </div>
                        </div>

                        {formData.dayType === "Weekdays" && (
                            <div className="space-y-3 p-4 bg-[#f6f4ee] border border-[#D5DbDB]">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="text-sm font-medium text-[#C72030]">
                                        Frequency:
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "1st Week",
                                        "2nd Week",
                                        "3rd Week",
                                        "4th Week",
                                        "5th Week",
                                        "All",
                                    ].map((week) => (
                                        <label
                                            key={week}
                                            className={`
                        flex items-center gap-2 px-3 py-1 border-2 cursor-pointer transition-all duration-200
                        ${formData.weekSelection.includes(week)
                                                    ? "border-[#C72030] bg-[#C72030] text-white"
                                                    : "border-[#D5DbDB] bg-white text-[#1a1a1a] hover:border-[#C72030]"
                                                }
                        ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.weekSelection.includes(week)}
                                                // onChange={() => handleWeekToggle(week)}
                                                disabled={isSubmitting}
                                                className="sr-only"
                                            />
                                            <span className="text-xs font-medium">
                                                {week === "All" ? "All Weeks" : week}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <div className="text-xs text-[#1a1a1a] opacity-70 mt-2">
                                    Days: Mon, Tue, Wed, Thu, Fri
                                </div>
                            </div>
                        )}
                    </div>
                </Section>
            </div>
        </div>
    )
}

export default CreateRoster