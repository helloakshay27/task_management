import { ChevronDown, ChevronUp, Clock, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const invoices = [
    {
        invoice: "INV001",
        paymentStatus: "Paid",
        totalAmount: "$250.00",
        paymentMethod: "Credit Card",
    },
];

export const DurationPicker = ({
    value = 0,
    onChange,
    className = "",
    disabled = false,
    placeholder = "Select duration",
    startDate,
    endDate,
    resposiblePerson = "Unassigned",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [taskType, setTaskType] = useState("standard");
    const [workingHours, setWorkingHours] = useState(0);
    const [dailyHours, setDailyHours] = useState([]);
    const [daysList, setDaysList] = useState([]);

    const pickerRef = useRef(null);

    /** ✅ Calculate working hours excluding weekends */
    const calculateWorkingHours = () => {
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate.year, endDate.month, endDate.date, endDate.hours || 0);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

        let workingDays = 0;
        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
            current.setDate(current.getDate() + 1);
        }

        return workingDays * 8; // Default 8 hours per working day
    };

    /** ✅ Generate all days (including weekends) */
    const getAllDays = (startDate, endDate) => {
        if (!startDate || !endDate) return [];

        const start = new Date(startDate);
        const end = new Date(endDate.year, endDate.month, endDate.date, endDate.hours || 0);
        if (end < start) return [];

        const days = [];
        const current = new Date(start);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            const formatted = current.toLocaleDateString("en-GB").replace(/\//g, "-");
            days.push({
                date: new Date(current),
                formatted,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            });
            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    /** ✅ When start/end changes */
    useEffect(() => {
        if (startDate && endDate) {
            if (taskType === "standard") {
                const hrs = calculateWorkingHours();
                setWorkingHours(hrs);
                if (onChange) onChange(hrs);
            } else {
                const allDays = getAllDays(startDate, endDate);
                setDaysList(allDays);
                const defaultHours = allDays.map((d) => (d.isWeekend ? "" : 8));
                setDailyHours(defaultHours);
                const total = defaultHours.reduce((sum, h) => sum + (Number(h) || 0), 0);
                setWorkingHours(total);
                if (onChange) onChange(total);
            }
        } else {
            setWorkingHours(0);
            setDaysList([]);
            setDailyHours([]);
            if (onChange) onChange(0);
        }
    }, [startDate, endDate, taskType]);

    /** ✅ Update total when flexible hours change */
    useEffect(() => {
        if (taskType === "flexible") {
            const total = dailyHours.reduce((sum, h) => sum + (Number(h) || 0), 0);
            setWorkingHours(total);
            if (onChange) onChange(total);
        }
    }, [dailyHours]);

    /** ✅ Close picker on outside click */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={pickerRef}>
            {/* === Main Button === */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                type="button"
                className={`w-full px-4 py-[7px] bg-white border border-gray-300 shadow-sm focus:outline-none transition-colors flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
            >
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span
                        className={`${workingHours === 0 ? "text-gray-400" : "text-gray-700 font-medium"
                            }`}
                    >
                        {workingHours > 0 ? `${workingHours} Hrs` : placeholder}
                    </span>
                </div>
                <span className="text-gray-400">
                    {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                </span>
            </button>

            {/* === Dropdown === */}
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-sm shadow-xl border border-gray-200 py-6 px-3 z-50">
                    {/* Task Type */}
                    <RadioGroup
                        value={taskType}
                        onValueChange={(val) => setTaskType(val)}
                        className="flex gap-3 mb-8"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="standard" id="standard" />
                            <Label htmlFor="standard">Standard</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="flexible" id="flexible" />
                            <Label htmlFor="flexible">Flexible</Label>
                        </div>
                    </RadioGroup>

                    {/* === Flexible Table === */}
                    {taskType === "flexible" ? (
                        (!startDate || !endDate) ? (
                            <div className="text-sm text-gray-500 bg-red-100 px-3 py-2 flex items-center gap-2">
                                <Info size={16} /> Please enter the Task's start and due date to enable flexible work hours.
                            </div>
                        ) : (
                            <div className="relative w-full overflow-x-auto">
                                <Table className="min-w-full border-collapse">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="sticky left-0 bg-white w-[200px] border-r">
                                                Owner
                                            </TableHead>
                                            {daysList.map((d, i) => (
                                                <TableHead
                                                    key={i}
                                                    className={`min-w-[120px] text-center ${d.isWeekend ? "bg-gray-100 text-gray-500" : "bg-white"
                                                        }`}
                                                >
                                                    {d.formatted}
                                                </TableHead>
                                            ))}
                                            <TableHead className="sticky right-0 bg-white border-l">
                                                Hrs
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="sticky left-0 bg-white border-r font-medium flex items-center gap-2">
                                                <div className="w-[35px] h-[55px] flex items-center justify-center text-sm font-bold">
                                                    <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                        {resposiblePerson.charAt(0).toUpperCase() || "U"}
                                                    </div>
                                                </div>
                                                {resposiblePerson || "Unassigned"}
                                            </TableCell>

                                            {daysList.map((d, idx) => (
                                                <TableCell
                                                    key={idx}
                                                    className={`text-center ${d.isWeekend ? "bg-gray-100" : ""
                                                        }`}
                                                >
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="24"
                                                        value={dailyHours[idx]}
                                                        onChange={(e) => {
                                                            const newHours = [...dailyHours];
                                                            newHours[idx] = e.target.value;
                                                            setDailyHours(newHours);
                                                        }}
                                                        disabled={d.isWeekend}
                                                        className={`w-16 border rounded-md text-center py-1 text-sm ${d.isWeekend
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : ""
                                                            }`}
                                                    />
                                                    <div className="text-xs text-gray-500 mt-1">100%</div>
                                                </TableCell>
                                            ))}

                                            <TableCell className="sticky right-0 bg-white border-l text-center font-medium">
                                                {workingHours.toFixed(2)}h
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    ) : (
                        <div className="relative w-full overflow-x-auto">
                            <Table className="min-w-full border-collapse">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 !z-20 bg-white w-[200px] border-r">
                                            Owner
                                        </TableHead>
                                        <TableHead className="min-w-[200px] bg-white">
                                            Business Hours
                                        </TableHead>
                                        <TableHead className="min-w-[200px] bg-white">
                                            Work Hours Per Day
                                        </TableHead>
                                        <TableHead className="min-w-[200px] bg-white">
                                            Duration
                                        </TableHead>
                                        <TableHead className="sticky right-0 z-20 bg-white border-l">
                                            Total Hours
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>

                                    <TableRow>
                                        <TableCell className="sticky left-0 bg-white border-r font-medium flex items-center gap-2">
                                            <div className="w-[35px] h-[55px] flex items-center justify-center text-sm font-bold">
                                                <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                    {resposiblePerson.charAt(0).toUpperCase() || "U"}
                                                </div>
                                            </div>
                                            {resposiblePerson || "Unassigned"}
                                        </TableCell>
                                        <TableCell className="min-w-[200px]">
                                            Standard Business Hours
                                        </TableCell>
                                        <TableCell className="min-w-[200px] !px-2">
                                            8:00 hr/day (100% day)
                                        </TableCell>
                                        <TableCell className="min-w-[200px]">
                                            3d
                                        </TableCell>
                                        <TableCell className="sticky right-0 bg-white z-10 border-l text-right">
                                            24:00hrs
                                        </TableCell>
                                    </TableRow>

                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => {
                                setDailyHours([]);
                                setDaysList([]);
                                setWorkingHours(0);
                                if (onChange) onChange(0);
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                            type="button"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-4 py-2 bg-[#c72030] text-white rounded-lg transition-colors font-medium"
                            type="button"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
