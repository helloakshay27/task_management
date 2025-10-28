import { Briefcase, CalendarDays, Timer, User2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const getRandomColor = () => {
    const r = Math.floor(Math.random() * 76) + 180;
    const g = Math.floor(Math.random() * 76) + 180;
    const b = Math.floor(Math.random() * 76) + 180;
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const calculateDuration = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

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

    return `${days > 0 ? days + "d " : ""}${remainingHours > 0 ? remainingHours + "h " : ""}${remainingMinutes > 0 ? remainingMinutes + "m " : ""
        }${remainingSeconds}s`;
};

const CountdownTimer = ({ startDate, targetDate }) => {
    const [countdown, setCountdown] = useState(calculateDuration(startDate, targetDate));

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(calculateDuration(startDate, targetDate));
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <div className="text-left text-[#029464] text-[12px]">{countdown}</div>
    );
};

const MilestoneCard = ({ milestone }) => {
    const token = localStorage.getItem("token");
    const dispatch = useDispatch();

    const [tasks, setTasks] = useState({
        total: 0,
        completed: 0
    })

    useEffect(() => {
        setTasks({
            total: milestone?.task_managements.length,
            completed: milestone?.task_managements.filter((task) => task.status === "completed").length
        })
    }, [])

    const navigate = useNavigate();
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: "MILESTONE",
        item: { type: "MILESTONE", id: milestone?.id, fromStatus: milestone?.status },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));
    return (
        <div
            ref={dragRef}
            style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}
            className="w-full h-max bg-white p-2 shadow-xl text-xs flex flex-col space-y-2 mb-2 rounded-sm"
        >
            <p className="mb-2 truncate cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                <span className="text-blue-500">{milestone?.id}</span> {milestone?.title}
            </p>

            <div className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                    <Timer className="text-[#029464] flex-shrink-0" size={14} />
                    <span className="text-[10px] text-[#029464] truncate">
                        <CountdownTimer startDate={milestone.start_date} targetDate={milestone.end_date} />
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Briefcase className="text-[#C72030] flex-shrink-0" size={14} />
                    <span className="text-[10px] truncate">{milestone?.resource_type}</span>
                </div>
                <div className="flex items-start gap-2">
                    <User2 className="text-[#C72030] flex-shrink-0" size={14} />
                    <span className="text-[10px] truncate">{milestone?.owner_name}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="text-[#C72030] flex-shrink-0" size={14} />
                        <span className="text-[10px]">{milestone?.start_date.split("T")[0]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="text-[#C72030] flex-shrink-0" size={14} />
                        <span className="text-[10px]">{milestone?.end_date.split("T")[0]}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 text-sm">

                {/* Tasks */}
                <div className="flex items-center gap-2">
                    <div className="w-20 font-light text-gray-600">Tasks</div>
                    <div className="w-4 text-center">{tasks.completed}</div>
                    <div className="flex-1 relative bg-gray-200 rounded-full h-4">
                        <div
                            className="absolute top-0 left-0 h-4 rounded-full bg-green-500"
                            style={{
                                width: `${tasks.total > 0
                                    ? (tasks.completed / tasks.total) *
                                    100
                                    : 0
                                    }%`,
                            }}
                        ></div>
                        <div className="absolute w-full text-[10px] text-center text-black font-medium">
                            {tasks.total > 0
                                ? Math.round(
                                    (tasks.completed / tasks.total) * 100
                                ) + "%"
                                : "0%"}
                        </div>
                    </div>
                    <div className="w-4 text-center">{tasks.total}</div>
                </div>

                {/* Issues */}
                {/* <div className="flex items-center gap-2">
                    <div className="w-20 font-light text-gray-600">Issues</div>
                    <div className="w-4 text-center">{project.completed_issues_count}</div>
                    <div className="flex-1 relative bg-gray-200 rounded-full h-4">
                        <div
                            className="absolute top-0 left-0 h-4 rounded-full bg-red-500"
                            style={{
                                width: `${project.total_issues_count > 0
                                    ? (project.completed_issues_count / project.total_issues_count) * 100
                                    : 0
                                    }%`,
                            }}
                        ></div>
                        <div className="absolute w-full text-[10px] text-center text-black font-medium">
                            {project.total_issues_count > 0
                                ? Math.round((project.completed_issues_count / project.total_issues_count) * 100) + "%"
                                : "0%"}
                        </div>
                    </div>
                    <div className="w-4 text-center">{project.total_issues_count}</div>
                </div> */}
            </div>


            <hr className="border border-gray-200 my-2" />

            <div className="flex items-center justify-end">
                <div className="flex items-center">
                    <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-gray-800`}
                        style={{ backgroundColor: getRandomColor() }}
                    >
                        {milestone.owner_name.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MilestoneCard