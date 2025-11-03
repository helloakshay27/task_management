import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const TaskDatePicker = ({
    onDateSelect,
    selectedDate
}) => {
    const scrollContainerRef = useRef(null);
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [availableDates, setAvailableDates] = useState([]);
    const [loading, setLoading] = useState(false);

    const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
    // Fetch data from backend when month/year changes
    useEffect(() => {
        fetchAvailableDates(currentMonth, currentYear);
    }, [currentMonth, currentYear]);

    const fetchAvailableDates = async (month, year) => {
        setLoading(true);
        try {
            // Replace this with your actual backend API call
            // const response = await fetch(`/api/dates?month=${month}&year=${year}`);
            // const data = await response.json();
            // setAvailableDates(data);

            // Sample data for demo - remove this in production
            const sampleData = getSampleData(month, year);
            setAvailableDates(sampleData);
        } catch (error) {
            console.error('Error fetching dates:', error);
            setAvailableDates([]);
        } finally {
            setLoading(false);
        }
    };

    // Sample data generator - replace with actual backend call
    const getSampleData = (month, year) => {
        if (month === 9 && year === 2025) { // October 2025
            return [
                { date: '10', hours: '02' },
                { date: '11', hours: '04' },
                { date: '12', hours: '10' },
                { date: '13', hours: '02' },
                { date: '14', hours: '06' },
                { date: '15', hours: '07' },
                { date: '16', hours: '08' },
                { date: '20', hours: '05' },
                { date: '25', hours: '03' },
            ];
        } else if (month === 10 && year === 2025) { // November 2025
            return [
                { date: '5', hours: '03' },
                { date: '12', hours: '05' },
                { date: '18', hours: '08' },
                { date: '25', hours: '04' },
            ];
        }
        return [];
    };

    // Get month details
    const getMonthDetails = (monthIndex, yearNum) => {
        const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
        return { daysInMonth };
    };

    const { daysInMonth } = getMonthDetails(currentMonth, currentYear);

    // Create all dates for the month
    const allDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayOfWeek = date.getDay();
        const dateData = availableDates.find(d => parseInt(d.date) === day);

        allDates.push({
            date: day,
            dayOfWeek: daysOfWeek[dayOfWeek],
            hours: dateData?.hours || '00',
            hasData: !!dateData,
            month: currentMonth,
            year: currentYear
        });
    }

    // Scroll functions
    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Month navigation
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    return (
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg py-6">
            {/* Header with Month Navigation and Year */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <button
                        type='button'
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Previous month"
                        disabled={loading}
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        type='button'
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Next month"
                        disabled={loading}
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <span className="text-sm font-semibold text-gray-700">
                    {monthNames[currentMonth]}, {currentYear}
                </span>
            </div>

            {/* Scrollable Date Container */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20 rounded-lg">
                        <div className="text-gray-600">Loading...</div>
                    </div>
                )}

                {/* Left Scroll Button */}
                <button
                    type='button'
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>

                {/* Date Grid */}
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

                            return (
                                <button
                                    type='button'
                                    key={index}
                                    onClick={() => onDateSelect(dateItem)}
                                    className={`flex flex-col items-center justify-center min-w-[40px] p-3 rounded-lg transition-all border-2 ${isSelected
                                        ? 'border-[#c72030] bg-red-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    {/* Day of Week */}
                                    <span className="text-sm font-medium text-gray-600 mb-2">
                                        {dateItem.dayOfWeek}
                                    </span>

                                    {/* Date */}
                                    <span className={`text-xl font-bold mb-2 ${isSelected ? 'text-red-600' : 'text-gray-800'
                                        }`}>
                                        {dateItem.date.toString().padStart(2, '0')}
                                    </span>

                                    {/* Hours */}
                                    <span className="text-xs text-gray-500">
                                        {dateItem.hours} hrs
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Scroll Button */}
                <button
                    type='button'
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
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