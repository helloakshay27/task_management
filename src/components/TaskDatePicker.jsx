import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const TaskDatePicker = ({
    onDateSelect,
    selectedDate,
    startDate = null,
    userAvailability = []
}) => {
    const scrollContainerRef = useRef(null);
    const buttonRefs = useRef({});
    const today = new Date();

    // Initialize with startDate if provided, otherwise use today
    const initialDate = startDate ? new Date(startDate) : today;
    const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
    const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
    const [focusedIndex, setFocusedIndex] = useState(null);
    const [hasInitialScroll, setHasInitialScroll] = useState(false);

    const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // When startDate prop changes after mount, move calendar focus to that month/year
    useEffect(() => {
        if (startDate) {
            const sd = new Date(startDate);
            setCurrentMonth(sd.getMonth());
            setCurrentYear(sd.getFullYear());
            setHasInitialScroll(false); // allow initial scroll to run for the new startDate
        }
    }, [startDate]);

    // --- Generate month data using userAvailability ---
    const getMonthDates = (monthIndex, yearNum) => {
        const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();

        const dates = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(yearNum, monthIndex, day);

            // ✅ Format in local time to avoid timezone shift
            const formattedDate = `${yearNum}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const availability = userAvailability?.find(
                (d) => d.date === formattedDate
            );

            dates.push({
                date: day,
                dayOfWeek: daysOfWeek[dateObj.getDay()],
                hours: availability ? String(availability.allocated_hours).padStart(2, '0') : '00',
                hasData: !!availability,
                month: monthIndex,
                year: yearNum,
            });
        }
        return dates;
    };

    // --- Continuous date logic ---
    const getContinuousDates = () => {
        if (!startDate) {
            // show prev + current + next month
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

            const prevMonthDates = getMonthDates(prevMonth, prevYear);
            const currentMonthDates = getMonthDates(currentMonth, currentYear);
            const nextMonthDates = getMonthDates(nextMonth, nextYear);

            return [...prevMonthDates, ...currentMonthDates, ...nextMonthDates];
        }

        // startDate provided: show continuous dates forward starting from it
        const start = new Date(startDate);
        const allDates = [];

        // Generate dates for 3 months starting from startDate's month
        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
            const monthIndex = (start.getMonth() + monthOffset) % 12;
            const yearOffset = Math.floor((start.getMonth() + monthOffset) / 12);
            const targetYear = start.getFullYear() + yearOffset;

            const monthDates = getMonthDates(monthIndex, targetYear);

            if (monthOffset === 0) {
                const filteredDates = monthDates.filter(d => d.date >= start.getDate());
                allDates.push(...filteredDates);
            } else {
                allDates.push(...monthDates);
            }
        }

        return allDates;
    };

    const allDates = getContinuousDates();

    // --- Scroll to startDate or today ---
    useEffect(() => {
        if (hasInitialScroll) return;
        if (!scrollContainerRef.current) return;
        if (allDates.length === 0) return;

        const target = startDate ? new Date(startDate) : new Date();

        const targetIndex = allDates.findIndex(d =>
            d.date === target.getDate() &&
            d.month === target.getMonth() &&
            d.year === target.getFullYear()
        );

        if (targetIndex === -1) {
            setHasInitialScroll(true);
            return;
        }

        setFocusedIndex(targetIndex);

        setTimeout(() => {
            const targetButton = buttonRefs.current[targetIndex];
            if (targetButton && scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = Math.max(0, targetButton.offsetLeft - 48);
                targetButton.focus();
            }
            setHasInitialScroll(true);
        }, 80);
    }, [allDates.length, hasInitialScroll, startDate]);

    // --- Keyboard navigation ---
    const handleKeyDown = (e, index) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const newIndex = Math.max(0, index - 1);
            setFocusedIndex(newIndex);

            const newDate = allDates[newIndex];
            if (newDate && (newDate.month !== currentMonth || newDate.year !== currentYear)) {
                setCurrentMonth(newDate.month);
                setCurrentYear(newDate.year);
            }
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const newIndex = Math.min(allDates.length - 1, index + 1);
            setFocusedIndex(newIndex);

            const newDate = allDates[newIndex];
            if (newDate && (newDate.month !== currentMonth || newDate.year !== currentYear)) {
                setCurrentMonth(newDate.month);
                setCurrentYear(newDate.year);
            }
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDateSelect(allDates[index]);
        }
    };

    // Keep DOM focus in sync
    useEffect(() => {
        if (focusedIndex !== null && buttonRefs.current[focusedIndex]) {
            buttonRefs.current[focusedIndex].focus();
            buttonRefs.current[focusedIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [focusedIndex]);

    // --- Scroll arrows ---
    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg py-6">
            <div className="flex justify-end items-center mb-2 px-6">
                <span className="text-sm font-semibold text-gray-700">
                    {monthNames[currentMonth]}, {currentYear}
                </span>
            </div>

            <div className="relative">
                <button
                    type='button'
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-50 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>

                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto scrollbar-hide px-12"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="flex gap-4 min-w-max">
                        {allDates.map((dateItem, index) => {
                            const isSelected = selectedDate?.date === dateItem.date &&
                                selectedDate?.month === dateItem.month &&
                                selectedDate?.year === dateItem.year;

                            const isCurrentMonth = dateItem.month === currentMonth &&
                                dateItem.year === currentYear;

                            return (
                                <button
                                    type="button"
                                    key={`${dateItem.year}-${dateItem.month}-${dateItem.date}`}
                                    ref={el => buttonRefs.current[index] = el}
                                    onClick={() => {
                                        onDateSelect(dateItem);
                                        setFocusedIndex(index);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className={`flex flex-col items-center justify-center min-w-[60px] p-3 rounded-lg transition-all ${isSelected
                                        ? 'border-[#c72030] bg-red-50'
                                        : isCurrentMonth
                                            ? 'border-gray-200 bg-white hover:border-gray-300'
                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200 opacity-60'
                                        }`}
                                >
                                    <span className={`text-base font-medium mb-1 ${isCurrentMonth ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                        {dateItem.dayOfWeek}
                                    </span>
                                    <span className={`text-base font-medium ${isSelected
                                        ? 'text-red-600'
                                        : isCurrentMonth
                                            ? 'text-gray-800'
                                            : 'text-gray-400'
                                        }`}>
                                        {dateItem.date.toString().padStart(2, '0')}
                                    </span>
                                    <span className={`w-full h-[2px] my-1 ${(dateItem.hours / 8 * 100).toFixed(2) < 33 ? "bg-[#1FCFB3]" : (dateItem.hours / 8 * 100).toFixed(2) < 66 ? "bg-[#ED9017]" : "bg-[#C72030]"}`}></span>
                                    <span className={`flex flex-col items-center ${isCurrentMonth ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                        <span className='text-base'>{dateItem.hours}</span>
                                        <span className='!text-[10px]'>hrs</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    type='button'
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-50 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
