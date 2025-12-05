import { useState, useEffect, useRef } from 'react';
import { Grid } from 'lucide-react';

const ColumnSelector = ({
  tableType, // "Task", "Project", "Issue", "Milestone"
  availableColumns,
  onColumnsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({});
  const dropdownRef = useRef(null);

  const STORAGE_KEY = `${tableType}TableColumns`;

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem(STORAGE_KEY);
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        setSelectedColumns(parsed);
      } catch (error) {
        console.error('Error parsing saved columns:', error);
        // If error, select all columns by default
        const allColumns = {};
        availableColumns.forEach((col) => {
          allColumns[col.id || col.key] = true;
        });
        setSelectedColumns(allColumns);
      }
    } else {
      // First time: select all columns by default
      const allColumns = {};
      availableColumns.forEach((col) => {
        allColumns[col.id || col.key] = true;
      });
      setSelectedColumns(allColumns);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allColumns));
    }
  }, [tableType, availableColumns, STORAGE_KEY]);

  // Handle checkbox change
  const handleColumnToggle = (columnId) => {
    const updatedColumns = {
      ...selectedColumns,
      [columnId]: !selectedColumns[columnId],
    };
    setSelectedColumns(updatedColumns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedColumns));
    onColumnsChange(updatedColumns);
  };

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if at least one column is selected
  const hasSelectedColumns = Object.values(selectedColumns).some((v) => v);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded border ${
          isOpen ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-300 hover:bg-gray-50'
        } text-sm`}
        title="Show/Hide Columns"
      >
        <Grid size={16} className="text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Columns to Display</h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableColumns.map((column) => {
                const columnId = column.id || column.key;
                const isChecked = selectedColumns[columnId] !== false; // Default true if not explicitly set to false

                return (
                  <label
                    key={columnId}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleColumnToggle(columnId)}
                      className="w-4 h-4 text-red-600 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {column.label || column.header || columnId}
                    </span>
                  </label>
                );
              })}
            </div>

            {!hasSelectedColumns && (
              <p className="text-xs text-red-600 mt-2 font-semibold">
                ⚠️ At least one column must be visible
              </p>
            )}
          </div>

          <div className="p-2 flex justify-between border-t border-gray-200">
            <button
              onClick={() => {
                const allColumns = {};
                availableColumns.forEach((col) => {
                  allColumns[col.id || col.key] = true;
                });
                setSelectedColumns(allColumns);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(allColumns));
                onColumnsChange(allColumns);
              }}
              className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              Select All
            </button>
            <button
              onClick={() => {
                // Keep at least one column selected
                const allColumns = {};
                availableColumns.forEach((col, idx) => {
                  allColumns[col.id || col.key] = idx === 0; // Only first column visible
                });
                setSelectedColumns(allColumns);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(allColumns));
                onColumnsChange(allColumns);
              }}
              className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;
