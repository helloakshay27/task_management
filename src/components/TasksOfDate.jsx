import {
    ChevronUp,
    ChevronDown,
    Calendar,
    CalendarCheck2,
    Timer,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDispatch } from "react-redux";
import { updateTask } from "@/redux/slices/taskSlice";
import toast from "react-hot-toast";

const calculateDuration = (end) => {
    const now = new Date();
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    const diffMs = endDate - now;
    if (diffMs <= 0) return "0s";
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${days > 0 ? days + "d" : ""} : ${remainingHours > 0 ? remainingHours + "h" : ""} : ${remainingMinutes > 0 ? remainingMinutes + "m" : ""}`;
};

const CountdownTimer = ({ targetDate }) => {
    const [countdown, setCountdown] = useState(calculateDuration(targetDate));
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(calculateDuration(targetDate));
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    return (
        <div className="text-left text-xs">{countdown}</div>
    );
};

// ===================== TaskCard =====================
const TaskCard = ({ task, selectedDate }) => {
    const date = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(
        2,
        "0"
    )}-${String(selectedDate.date).padStart(2, "0")}`;

    // Calculate today's total allocation
    const todayAllocation = (task.allocation_times || [])
        .filter(a => a.date === date)
        .reduce(
            (acc, a) => {
                const totalMins = acc.minutes + (a.minutes || 0);
                const totalHours = acc.hours + (a.hours || 0) + Math.floor(totalMins / 60);
                return { hours: totalHours, minutes: totalMins % 60 };
            },
            { hours: 0, minutes: 0 }
        );

    const hours = String(todayAllocation?.hours ?? 0).padStart(2, "0");
    const minutes = String(todayAllocation?.minutes ?? 0).padStart(2, "0");

    const [{ isDragging }, drag] = useDrag(() => ({
        type: "TASK",
        item: { task },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={`p-3 mb-2 border-l-4 ${task.priority === "High" ? "border-[#C72030]" : task.priority === "Medium" ? "border-[#ED9017]" : "border-[#1FCFB3]"} bg-[#D5DBDB] ${isDragging ? "opacity-50" : ""
                }`}
        >
            <div className="text-xs font-medium text-gray-800 mb-2 text-ellipsis whitespace-nowrap overflow-hidden">{task.title}</div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{task.target_date}</span>
                </div>
                <div className="flex items-center gap-1">
                    <CalendarCheck2 className="w-4 h-4" />
                    <span>{`${hours}:${minutes} Hrs`}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    <CountdownTimer targetDate={task.target_date} />
                </div>
                <div className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    <span>{`${task.estimated_hour} Hrs`}</span>
                </div>
            </div>
        </div>
    );
};

// ===================== DroppableDay =====================
const DroppableDay = ({ dateInfo, onDrop, assignedTasks }) => {
    const [{ isOver }, drop] = useDrop(
        () => ({
            accept: "TASK",
            drop: (item) => onDrop(item.task, dateInfo),
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
            }),
        }),
        [dateInfo] // ✅ ensures drop updates when weekDates change
    );

    const calculationHrs = (typeof dateInfo.allocated_hours_num !== 'undefined')
        ? dateInfo.allocated_hours_num
        : parseFloat(String(dateInfo.hours).split(" ")[0]) || 0;
    const durationPercentage = (calculationHrs / 8) * 100;

    const bgClass = dateInfo.isSelected
        ? "bg-blue-50"
        : dateInfo.overloaded
            ? "bg-red-100"
            : assignedTasks[dateInfo.fullDate]
                ? "bg-[#D5DBDB]"
                : "hover:bg-gray-50";

    return (
        <div
            ref={drop}
            className={`relative grid grid-cols-3 border-t border-b border-r border-dashed border-gray-400 items-center px-3 py-[19px] ${bgClass} ${isOver ? "bg-gray-200" : ""
                }`}
        >
            <span
                className={`absolute left-0 top-0 h-full w-[4px] ${durationPercentage <= 33
                    ? "bg-[#1FCFB3]"
                    : durationPercentage <= 66
                        ? "bg-[#ED9017]"
                        : "bg-[#C72030]"
                    }`}
            />
            <div className="font-medium text-xs text-left">{dateInfo.day}</div>
            <div className="text-xs text-gray-600 text-left">{dateInfo.date}</div>
            <div className="font-semibold text-xs text-right">{dateInfo.hours}</div>
            {dateInfo.isPending && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded">Processing...</div>
                </div>
            )}
        </div>
    );
};

// ===================== CalendarWeekView =====================
const CalendarWeekView = ({
    selectedDate,
    weekDates,
    onScroll,
    onDrop,
    assignedTasks,
}) => {
    return (
        <div className="bg-white border-gray-300 relative">
            {/* Scroll Up */}
            <div className="flex items-center justify-center absolute -top-[23px] left-[50%] translate-x-[-50%] z-10">
                <button
                    type="button"
                    onClick={() => onScroll("up")}
                    className="p-1 rounded"
                >
                    <ChevronUp className="w-5 h-5" />
                </button>
            </div>

            {/* Week Days */}
            <div className="space-y-1 my-4">
                {weekDates.map((dateInfo) => (
                    <DroppableDay
                        key={dateInfo.fullDate} // ✅ key ensures remount on scroll
                        dateInfo={dateInfo}
                        onDrop={onDrop}
                        assignedTasks={assignedTasks}
                    />
                ))}
            </div>

            {/* Scroll Down */}
            <div className="flex items-center justify-center absolute -bottom-[25px] left-[50%] translate-x-[-50%] z-10">
                <button
                    type="button"
                    onClick={() => onScroll("down")}
                    className="p-1 rounded"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

// ===================== TasksOfDate =====================
const TasksOfDate = ({ selectedDate, onClose, tasks, userAvailability }) => {
    const dispatch = useDispatch();
    const token = localStorage.getItem("token");

    const [dateStartIndex, setDateStartIndex] = useState(0);
    const [assignedTasks, setAssignedTasks] = useState({});
    // track local adjustments to availability after successful drops
    const [availabilityUpdates, setAvailabilityUpdates] = useState({});
    // track pending drops per date so UI doesn't apply change until API returns
    const [pendingDrops, setPendingDrops] = useState({});
    const [taskStartIndex, setTaskStartIndex] = useState(0);
    const [currentTasks, setCurrentTasks] = useState([]);

    useEffect(() => {
        if (tasks.length > 0) {
            setCurrentTasks(tasks);
        }
    }, [tasks]);

    const visibleTasksCount = 3;
    const visibleDaysCount = 3;

    // ✅ Build weekDates directly from userAvailability
    const weekDates = useMemo(() => {
        if (!userAvailability || userAvailability.length === 0) return [];

        const sorted = [...userAvailability].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        const visible = sorted.slice(
            dateStartIndex,
            dateStartIndex + visibleDaysCount
        );

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const selectedFullDate = selectedDate
            ? new Date(2024, selectedDate.month, selectedDate.date)
                .toISOString()
                .split("T")[0]
            : new Date().toISOString().split("T")[0];

        // helper to format hours string (shows decimals if needed)
        const formatHoursString = (h) => {
            if (Number.isInteger(h)) return `${String(h).padStart(2, "0")} hrs`;
            return `${h.toFixed(2)} hrs`;
        };

        return visible.map((u) => {
            const d = new Date(u.date);
            const day = dayNames[d.getDay()];
            const month = d.toLocaleString("default", { month: "short" });
            const date = d.getDate();

            // apply any local availability updates for this date
            const added = availabilityUpdates[u.date] || 0;
            const hoursNum = (Number(u.allocated_hours) || 0) + added;

            return {
                day,
                date: `${date} ${month}`,
                hours: formatHoursString(hoursNum),
                allocated_hours_num: hoursNum,
                fullDate: u.date,
                isSelected: u.date === selectedFullDate,
                overloaded: u.overloaded,
                isPending: !!pendingDrops[u.date],
            };
        });
    }, [userAvailability, dateStartIndex, visibleDaysCount, selectedDate, availabilityUpdates, pendingDrops]);

    const handleScroll = (direction) => {
        if (direction === "up" && dateStartIndex > 0) {
            setDateStartIndex(dateStartIndex - 1);
        } else if (
            direction === "down" &&
            dateStartIndex + visibleDaysCount < userAvailability.length
        ) {
            setDateStartIndex(dateStartIndex + 1);
        }
    };

    const handleDrop = async (task, dateInfo) => {
        const fullDate = dateInfo.fullDate;
        if (assignedTasks[fullDate] || pendingDrops[fullDate]) return;

        const formatedSelectedDate = `${selectedDate.year}-${(
            selectedDate.month + 1
        )
            .toString()
            .padStart(2, "0")}-${selectedDate.date.toString().padStart(2, "0")}`;

        // compute hours to add for the target date from this task's allocation entries
        const addedHours = (task.allocation_times || [])
            .filter((t) => t.date == formatedSelectedDate)
            .reduce((acc, t) => {
                const hrs = Number(t.hours || 0);
                const mins = Number(t.minutes || 0);
                return acc + hrs + mins / 60;
            }, 0);

        try {
            // mark as pending so UI doesn't show assignment until success
            setPendingDrops((p) => ({ ...p, [fullDate]: true }));

            await dispatch(
                updateTask({
                    token,
                    id: task.id,
                    payload: {
                        ...(task.target_date == formatedSelectedDate && {
                            target_date: fullDate,
                            allocation_date: fullDate,
                        }),
                        task_allocation_times_attributes: task.allocation_times.map((t) =>
                            t.date == formatedSelectedDate
                                ? { ...t, date: fullDate }
                                : t
                        ),
                    },
                })
            ).unwrap();

            // only after success update local UI state
            setAssignedTasks((prev) => ({ ...prev, [fullDate]: task }));
            setAvailabilityUpdates((prev) => ({
                ...prev,
                [fullDate]: (prev[fullDate] || 0) + addedHours,
            }));
            setCurrentTasks((prev) => prev.filter((t) => t.id !== task.id));
        } catch (err) {
            console.error("Failed to update task on drop:", err);
            // optionally inform user - minimal handling here
            toast.error("Could not move task. Please try again.");
        } finally {
            setPendingDrops((p) => {
                const copy = { ...p };
                delete copy[fullDate];
                return copy;
            });
        }
    };

    const handleTaskScroll = (direction) => {
        if (
            direction === "down" &&
            taskStartIndex + visibleTasksCount < currentTasks.length
        ) {
            setTaskStartIndex(taskStartIndex + 1);
        } else if (direction === "up" && taskStartIndex > 0) {
            setTaskStartIndex(taskStartIndex - 1);
        }
    };

    const hasMoreTasks = taskStartIndex + visibleTasksCount < currentTasks.length;
    const hasPreviousTasks = taskStartIndex > 0;

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const selectedDateString = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(
        2,
        "0"
    )}-${String(selectedDate.date).padStart(2, "0")}`;

    const selectedDayAvailability = userAvailability?.find(
        (u) => u.date === selectedDateString
    );

    const formatHoursString = (h) => {
        if (Number.isInteger(h)) return `${String(h).padStart(2, "0")} hrs`;
        return `${h.toFixed(2)} hrs`;
    };

    const selectedHoursNum = (Number(selectedDayAvailability?.allocated_hours) || 0) + (availabilityUpdates[selectedDateString] || 0);
    const totalTaskHours = formatHoursString(selectedHoursNum);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bg-white mt-3">
                {/* Header */}
                <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold">
                            {selectedDate?.day || "Sunday"}
                        </span>
                        <span>
                            {selectedDate?.date || "10"}{" "}
                            {monthNames[selectedDate?.month || 9]}
                        </span>
                    </div>
                    <div className="font-semibold">
                        Total Task Hours: {totalTaskHours}
                    </div>
                </div>

                {/* Content */}
                <div className="py-4 grid grid-cols-3 gap-3">
                    {/* Left: Task List */}
                    <div className="col-span-2 relative">
                        {hasPreviousTasks && (
                            <div className="flex justify-center mb-1 absolute -top-[18px] left-[50%] translate-x-[-50%] z-10">
                                <button
                                    className="rounded"
                                    type="button"
                                    onClick={() => handleTaskScroll("up")}
                                >
                                    <ChevronUp className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                        )}

                        <div
                            className="space-y-2 overflow-hidden"
                            style={{ height: `${visibleTasksCount * 72}px` }}
                        >
                            <div
                                className="transition-transform duration-300 ease-in-out space-y-2"
                                style={{
                                    transform: `translateY(-${taskStartIndex * 72}px)`,
                                }}
                            >
                                {currentTasks.length > 0 ? (
                                    currentTasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            selectedDate={selectedDate}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 text-sm">
                                        No tasks available
                                    </div>
                                )}
                            </div>
                        </div>

                        {hasMoreTasks && (
                            <div className="flex justify-center mt-1 absolute -bottom-[16px] left-[50%] translate-x-[-50%] z-10">
                                <button
                                    className="rounded"
                                    type="button"
                                    onClick={() => handleTaskScroll("down")}
                                >
                                    <ChevronDown className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Calendar View */}
                    <div className="col-span-1">
                        <CalendarWeekView
                            selectedDate={selectedDate}
                            weekDates={weekDates}
                            onScroll={handleScroll}
                            onDrop={handleDrop}
                            assignedTasks={assignedTasks}
                        />
                    </div>
                </div>
            </div>
        </DndProvider >
    );
};

export default TasksOfDate;
