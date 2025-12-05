import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { baseURL } from '../../apiDomain';
import { X } from 'lucide-react';
import StatusBadge from './Home/Projects/statusBadge';

const TaskTitleAutocomplete = ({ value, onChange, disabled = false, token, milestone_id }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Fetch tasks based on milestone and search term
  const fetchTaskSuggestions = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setFilteredSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (milestone_id) {
        params.append('q[milestone_id_eq]', milestone_id);
      }
      params.append('q[title_cont]', searchTerm.trim());

      const response = await axios.get(`${baseURL}/task_managements.json?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const tasks = Array.isArray(response.data.task_managements)
        ? response.data.task_managements
        : [];
      setSuggestions(tasks);
      setFilteredSuggestions(tasks);
      setIsOpen(tasks.length > 0);
    } catch (error) {
      console.error('Error fetching task suggestions:', error);
      setSuggestions([]);
      setFilteredSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange({ target: { name: 'taskTitle', value: newValue } });

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newValue.trim()) {
      setLoading(true);
      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        fetchTaskSuggestions(newValue);
      }, 400);
    } else {
      setSuggestions([]);
      setFilteredSuggestions([]);
      setIsOpen(false);
      setLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (task) => {
    onChange({ target: { name: 'taskTitle', value: task.title } });
    setIsOpen(false);
    setSuggestions([]);
    setFilteredSuggestions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clean up debounce timer on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center relative">
        <input
          ref={inputRef}
          type="text"
          name="taskTitle"
          autoComplete="off"
          placeholder="Enter Task Title"
          className="w-full border h-[40px] outline-none border-gray-300 p-2 text-[13px]"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          onFocus={() => {
            if (value.trim() && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange({ target: { name: 'taskTitle', value: '' } });
              setSuggestions([]);
              setFilteredSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-2 p-1 hover:bg-gray-100 rounded"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500 text-[13px]">Loading suggestions...</div>
          ) : filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((task) => (
              <div
                key={task.id}
                onClick={() => handleSuggestionClick(task)}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{task.title}</p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500 text-[13px]">No tasks found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskTitleAutocomplete;
