import { ChevronUp, ChevronDown, Calendar, Clock, CircleDot } from 'lucide-react';
import { useState } from 'react';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';

const TaskCard = ({ task }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'TASK',
        item: { task },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={`p-3 mb-2 rounded border-l-4 border-[#C72030] bg-[#D5DBDB] ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="text-xs font-medium text-gray-800 mb-2">{task.title}</div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{task.date}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{task.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                    <CircleDot className="w-3 h-3" />
                    <span>{task.time}</span>
                </div>
            </div>
        </div>
    );
};

const CalendarWeekView = ({ selectedDate, weekDates, onScroll, onDrop, assignedTasks }) => {
    return (
        <div className="bg-white rounded border border-gray-300">
            <div className="flex items-center justify-center border-b border-gray-300">
                <button
                    type='button'
                    onClick={() => onScroll('up')}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <ChevronUp className="w-5 h-5" />
                </button>
            </div>

            <div className="divide-y divide-gray-200">
                {weekDates.map((dateInfo, index) => {
                    const [{ isOver }, drop] = useDrop(() => ({
                        accept: 'TASK',
                        drop: (item) => onDrop(item.task, dateInfo),
                        collect: (monitor) => ({
                            isOver: !!monitor.isOver(),
                        }),
                    }));

                    const bgClass = assignedTasks[dateInfo.fullDate]
                        ? 'bg-[#D5DBDB]'
                        : dateInfo.isSelected
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50';

                    return (
                        <div
                            key={index}
                            ref={drop}
                            className={`relative grid grid-cols-3 items-center px-3 py-[19px] ${bgClass} ${isOver ? 'bg-gray-200' : ''}`}
                        >
                            <span className="absolute left-0 top-0 h-full w-[4px] bg-[#C72030]" />
                            <div className="font-medium text-xs text-left">{dateInfo.day}</div>

                            <div className="text-xs text-gray-600 text-left">{dateInfo.date}</div>

                            <div className="font-semibold text-xs text-right">{dateInfo.hours}</div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-center border-t border-gray-300">
                <button
                    type='button'
                    onClick={() => onScroll('down')}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const TasksOfDate = ({ selectedDate, onClose }) => {
    const [dateOffset, setDateOffset] = useState(0);
    const [assignedTasks, setAssignedTasks] = useState({});
    const [taskStartIndex, setTaskStartIndex] = useState(0);
    const [currentTasks, setCurrentTasks] = useState([
        {
            id: 1,
            title: 'FM Matrix Training',
            date: '23 Aug',
            duration: '02:36 Hrs',
            time: '09:06',
            type: 'primary'
        },
        {
            id: 2,
            title: 'Design Figma Page of Task creation and hand it over to developers.',
            date: '23 Aug',
            duration: '02:36 Hrs',
            time: '09:06',
            type: 'secondary'
        },
        {
            id: 3,
            title: 'Give Inventory training to Yukta and Abdul.',
            date: '23 Aug',
            duration: '02:36 Hrs',
            time: '09:06',
            type: 'tertiary'
        },
        {
            id: 4,
            title: 'Review documentation and update API endpoints.',
            date: '23 Aug',
            duration: '01:30 Hrs',
            time: '14:00',
            type: 'tertiary'
        },
        {
            id: 5,
            title: 'Team standup meeting and sprint planning.',
            date: '23 Aug',
            duration: '01:00 Hrs',
            time: '10:00',
            type: 'primary'
        },
        {
            id: 6,
            title: 'Code review for pull requests.',
            date: '23 Aug',
            duration: '02:00 Hrs',
            time: '15:30',
            type: 'secondary'
        }
    ]);
    const visibleTasksCount = 3;
    const visibleDaysCount = 3;

    // Generate dynamic dates based on offset
    const generateDynamicDates = () => {
        const dates = [];
        const today = selectedDate ? new Date(2024, selectedDate.month, selectedDate.date) : new Date();
        const selectedFullDate = today.toISOString().split('T')[0];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Generate dates starting from dateOffset
        for (let i = 0; i < visibleDaysCount; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + dateOffset + i);

            const fullDate = currentDate.toISOString().split('T')[0];
            const dayName = dayNames[currentDate.getDay()];
            const date = currentDate.getDate();
            const month = currentDate.toLocaleString('default', { month: 'short' });

            // Calculate random hours for demo (replace with actual data)
            const hours = Math.floor(Math.random() * 9);

            dates.push({
                day: dayName,
                date: `${date} ${month}`,
                hours: `${hours.toString().padStart(2, '0')} hrs`,
                isSelected: fullDate === selectedFullDate,
                hasIndicator: hours > 0,
                indicatorColor: hours > 6 ? 'green' : hours > 3 ? 'orange' : 'blue',
                fullDate,
            });
        }

        return dates;
    };

    const weekDates = generateDynamicDates();

    const handleScroll = (direction) => {
        if (direction === 'up') {
            // Scroll to previous dates
            setDateOffset(dateOffset - 1);
        } else {
            // Scroll to next dates
            setDateOffset(dateOffset + 1);
        }
    };

    const handleDrop = (task, dateInfo) => {
        const fullDate = dateInfo.fullDate;
        if (assignedTasks[fullDate]) {
            return;
        }
        setAssignedTasks((prev) => ({ ...prev, [fullDate]: task }));
        setCurrentTasks((prev) => prev.filter((t) => t.id !== task.id));
    };

    const handleTaskScroll = (direction) => {
        if (direction === 'down' && taskStartIndex + visibleTasksCount < currentTasks.length) {
            setTaskStartIndex(taskStartIndex + 1);
        } else if (direction === 'up' && taskStartIndex > 0) {
            setTaskStartIndex(taskStartIndex - 1);
        }
    };

    const hasMoreTasks = taskStartIndex + visibleTasksCount < currentTasks.length;
    const hasPreviousTasks = taskStartIndex > 0;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bg-white">
                {/* Header */}
                <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold">
                            {selectedDate?.day || 'Sunday'}
                        </span>
                        <span>
                            {selectedDate?.date || '10'} {monthNames[selectedDate?.month || 9]}
                        </span>
                    </div>
                    <div className="font-semibold">
                        Total Task Hours: {selectedDate?.totalHours || '08'}
                    </div>
                </div>

                {/* Content Area */}
                <div className="py-4 grid grid-cols-3 gap-3">
                    {/* Left Side - Tasks List */}
                    <div className='col-span-2'>
                        {/* Scroll Up Button */}
                        {hasPreviousTasks && (
                            <div className="flex justify-center mb-1">
                                <button
                                    className="hover:bg-gray-100 rounded"
                                    type='button'
                                    onClick={() => handleTaskScroll('up')}
                                >
                                    <ChevronUp className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                        )}

                        <div className="space-y-2 overflow-hidden" style={{ height: `${visibleTasksCount * 72}px` }}>
                            <div
                                className="transition-transform duration-300 ease-in-out space-y-2"
                                style={{ transform: `translateY(-${taskStartIndex * 72}px)` }}
                            >
                                {currentTasks.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        </div>

                        {/* Expand More */}
                        {hasMoreTasks && (
                            <div className="flex justify-center mt-1">
                                <button
                                    className="hover:bg-gray-100 rounded"
                                    type='button'
                                    onClick={() => handleTaskScroll('down')}
                                >
                                    <ChevronDown className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Calendar Week View */}
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
        </DndProvider>
    );
}

export default TasksOfDate;