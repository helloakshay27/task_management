import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const StatusBadge = ({ status: initialStatus, statusOptions, onStatusChange, statusColors }) => {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Create a ref for the wrapper div to detect outside clicks
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  const handleStatusSelect = (newStatus) => {
    setCurrentStatus(newStatus);
    setIsDropdownOpen(false);

    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  const handleDropdownItemClick = (e, option) => {
    e.preventDefault();
    e.stopPropagation();
    handleStatusSelect(option);
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on dropdown items
      if (event.target.classList.contains('dropdown-item')) {
        return;
      }

      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup listener on unmount or when dropdown closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div
      className="status-badge-wrapper"
      style={{ position: 'relative', display: 'inline-block' }}
      ref={wrapperRef}
    >
      <div
        onClick={toggleDropdown}
        className="status-display"
        role="button"
        tabIndex={0}
        ref={triggerRef}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDropdown()}
      >
        <span
          className={`rounded-full w-[5px] h-[5px] ${!statusColors ? `status-${currentStatus?.toLowerCase().replace('_', '-')}` : ''}`}
          style={statusColors && currentStatus ? { backgroundColor: statusColors[currentStatus] || '#c72030' } : {}}
        ></span>
        <span>
          {currentStatus &&
            currentStatus
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
        </span>
      </div>

      {isDropdownOpen &&
        createPortal(
          <div
            className="status-dropdown"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: '150px',
              zIndex: 9999,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            {statusOptions &&
              statusOptions?.map((option) => (
                <span
                  key={option}
                  onClick={(e) => handleDropdownItemClick(e, option)}
                  className={`dropdown-item ${option?.toLowerCase().replace(' ', '-') ===
                      currentStatus?.toLowerCase().replace(' ', '-')
                      ? 'selected'
                      : ''
                    }`}
                  style={{
                    display: 'block',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor:
                      option?.toLowerCase().replace(' ', '-') ===
                        currentStatus?.toLowerCase().replace(' ', '-')
                        ? '#D3D3D3'
                        : 'transparent',
                    fontSize: '12px',
                  }}
                  onMouseEnter={(e) => {
                    if (
                      option?.toLowerCase().replace(' ', '-') !==
                      currentStatus?.toLowerCase().replace(' ', '-')
                    ) {
                      e.target.style.backgroundColor = '#c72030';
                      e.target.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      option?.toLowerCase().replace(' ', '-') !==
                      currentStatus?.toLowerCase().replace(' ', '-')
                    ) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'black';
                    }
                  }}
                  role="option"
                  aria-selected={
                    option?.toLowerCase().replace(' ', '-') ===
                    currentStatus?.toLowerCase().replace(' ', '-')
                  }
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') && handleDropdownItemClick(e, option)
                  }
                >
                  {option
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
              ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default StatusBadge;
