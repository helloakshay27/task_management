import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

export const CustomDatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  label = 'Start',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const pickerRef = useRef(null);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Build days in current month, safe from timezone shift
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);

    // ✅ Use noon (12:00) to avoid timezone rollback
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i, 12, 0, 0, 0));
    }

    return days;
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isToday = (date) => isSameDay(date, new Date());

  // ✅ Normalize selected date (safe from timezone bug)
  const handleDateSelect = (date) => {
    if (!date) {
      onChange(null);
    } else {
      const safeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
      onChange(safeDate);
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Input button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-[7px] text-sm border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
      >
        {value ? (
          <div className="text-black flex items-center justify-between w-full">
            <Calendar className="w-4 h-4" />
            <div className="text-[13px]">
              {label} : {value.getDate().toString().padStart(2, '0')} {monthNames[value.getMonth()]}
            </div>
            <X className="w-4 h-4 cursor-pointer" onClick={handleClear} />
          </div>
        ) : (
          <div className="text-gray-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-[13px]">{placeholder}</span>
          </div>
        )}
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white rounded-md shadow-lg border border-gray-200 p-2 w-64">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
              }
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <div className="text-sm font-semibold text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
              }
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, idx) => (
              <div key={idx}>
                {day ? (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`w-full aspect-square flex items-center justify-center text-xs rounded transition-colors ${
                      isSameDay(day, value)
                        ? 'bg-red-500 text-white font-semibold hover:bg-red-600'
                        : isToday(day)
                          ? 'bg-red-50 text-red-600 font-semibold hover:bg-red-100'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                ) : (
                  <div className="w-full aspect-square" />
                )}
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleDateSelect(null)}
              className="flex-1 p-2 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const safeToday = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                  12,
                  0,
                  0,
                  0
                );
                handleDateSelect(safeToday);
                setCurrentMonth(today);
              }}
              className="flex-1 p-2 text-xs text-white bg-[#c72030] rounded hover:bg-red-700"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
