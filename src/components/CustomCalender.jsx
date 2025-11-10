import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';

export const CustomCalender = ({
    initialDate = new Date(), // Default to current month
    selectedDate: propSelectedDate, // Optional external selected date
    eventDates = [],
    taskHoursData = [],
    onDateSelect = () => { },
    onMonthChange = () => { },
    setShowCalender
}) => {
    const today = new Date();

    // Default to current month and today as selected
    const [currentDate, setCurrentDate] = useState(initialDate || today);
    const [selectedDate, setSelectedDate] = useState(propSelectedDate || today);

    const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return firstDay === 0 ? 6 : firstDay - 1; // Adjust to start week on Monday
    };

    const isSameDay = (date1, date2) => {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    const hasEvent = (day, month, year) => {
        return eventDates.some(eventDate =>
            eventDate.getDate() === day &&
            eventDate.getMonth() === month &&
            eventDate.getFullYear() === year
        );
    };

    const getTaskHoursIndicator = (day, month, year) => {
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const matchingData = taskHoursData.find(data => {
            const dataDate = typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0];
            return dataDate === formattedDate;
        });

        if (!matchingData) return null;

        const hours = matchingData.hours;
        const percentage = ((hours / 8) * 100);

        if (percentage <= 33) return '#1FCFB3';
        if (percentage <= 66) return '#ED9017';
        return '#c72030';
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const prevMonth = new Date(year, month - 1, 1);
        const daysInPrevMonth = getDaysInMonth(prevMonth);

        // Days from previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: daysInPrevMonth - i,
                isCurrentMonth: false,
                month: month - 1,
                year: month === 0 ? year - 1 : year
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                day,
                isCurrentMonth: true,
                month,
                year
            });
        }

        // Next month days to fill grid (6 rows)
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                day,
                isCurrentMonth: false,
                month: month + 1,
                year: month === 11 ? year + 1 : year
            });
        }

        return days;
    };

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        setCurrentDate(newDate);
        onMonthChange(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        setCurrentDate(newDate);
        onMonthChange(newDate);
    };

    const handleDateClick = (dayObj) => {
        const clickedDate = {
            date: dayObj.day,
            month: dayObj.month,
            year: dayObj.year
        }
        setSelectedDate(clickedDate);
        onDateSelect(clickedDate);
        setShowCalender(false)
    };

    const calendarDays = generateCalendarDays();

    return (
        <div className="w-full max-w-xs mx-auto bg-white rounded-2xl shadow-lg p-4 my-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type='button'
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <h2 className="text-base font-semibold">
                    {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                </h2>

                <button
                    type='button'
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Next month"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map(day => (
                    <div key={day} className="text-center font-medium text-gray-700 text-xs py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayObj, index) => {
                    const dateObj = new Date(dayObj.year, dayObj.month, dayObj.day);
                    const isSelected = isSameDay(dateObj, selectedDate);
                    const isToday = isSameDay(dateObj, today);
                    const taskIndicator = getTaskHoursIndicator(dayObj.day, dayObj.month, dayObj.year);

                    return (
                        <button
                            type='button'
                            key={index}
                            onClick={() => handleDateClick(dayObj)}
                            className={`
                                relative aspect-square flex flex-col items-center justify-center rounded-full text-xs font-medium transition-all
                                ${!dayObj.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                                ${isSelected ? 'bg-red-100 text-red-500' : 'hover:bg-gray-100'}
                                ${isToday && !isSelected ? 'border border-red-300' : ''}
                            `}
                        >
                            {dayObj.day.toString().padStart(2, '0')}
                            {taskIndicator && (
                                <div className="absolute bottom-1 flex gap-0.5">
                                    <div className={`w-1 h-1 rounded-full bg-[${taskIndicator}]`} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Collapse Button */}
            <div className="flex justify-center mt-3">
                <button
                    type='button'
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setShowCalender(false)}
                >
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                </button>
            </div>
        </div>
    );
};
