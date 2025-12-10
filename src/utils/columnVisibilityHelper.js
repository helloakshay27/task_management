/**
 * Get visible columns based on column visibility settings
 * @param {Array} allColumns - All available columns
 * @param {Object} selectedColumns - Column visibility map { columnId: true/false }
 * @returns {Array} - Filtered columns
 */
export const getVisibleColumns = (allColumns, selectedColumns) => {
  // If selectedColumns is empty or not provided, show all columns by default
  if (!selectedColumns || Object.keys(selectedColumns).length === 0) {
    return allColumns;
  }

  return allColumns.filter((column) => {
    const columnId = column.id || column.accessorKey;
    // Default to true (visible) if not explicitly set to false
    return selectedColumns[columnId] !== false;
  });
};

/**
 * Load column visibility from localStorage
 * @param {string} storageKey - The key to use for localStorage
 * @param {Array} defaultColumns - Default columns to show if nothing is saved
 * @returns {Object} - Column visibility map
 */
export const loadColumnVisibility = (storageKey, defaultColumns) => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    // If nothing saved, show all by default
    const visibility = {};
    defaultColumns.forEach((col) => {
      visibility[col.id || col.key] = true;
    });
    return visibility;
  } catch (error) {
    console.error(`Error loading column visibility for ${storageKey}:`, error);
    return {};
  }
};

/**
 * Save column visibility to localStorage
 * @param {string} storageKey - The key to use for localStorage
 * @param {Object} columnVisibility - Column visibility map
 */
export const saveColumnVisibility = (storageKey, columnVisibility) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
  } catch (error) {
    console.error(`Error saving column visibility for ${storageKey}:`, error);
  }
};
