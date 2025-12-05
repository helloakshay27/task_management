import { useState, useEffect, useRef, Fragment, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { useDispatch, useSelector } from 'react-redux';
import StatusBadge from '../Projects/statusBadge';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Link, useParams } from 'react-router-dom';
import '../../Home/Sprints/Table.css';
import { getTaskPaths, useIsCloudRoute } from '../../../utils/navigationUtils';
import {
  fetchTasks,
  createTask,
  changeTaskStatus,
  updateTask,
  filterTask,
  fetchMyTasks,
  createTaskComment,
} from '../../../redux/slices/taskSlice';
import { fetchUsers } from '../../../redux/slices/userSlice';
import SelectBox from '../../SelectBox';
import Loader from '../../Loader';
import { useLocation } from 'react-router-dom';
import qs from 'qs';
import { fetchProjectTeamMembers } from '../../../redux/slices/projectSlice';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseURL } from '../../../../apiDomain';
import { X, Play, Pause } from 'lucide-react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const globalPriorityOptions = ['None', 'Low', 'Medium', 'High', 'Urgent'];
const globalStatusOptions = ['open', 'in_progress', 'completed', 'on_hold', 'overdue'];

const EditableTextField = ({
  value,
  onUpdate,
  inputRef,
  isNewRow,
  onEnterPress,
  validator,
  'data-task-id': taskId,
  'data-field-name': fieldName,
}) => {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => setLocalValue(value), [value]);
  useEffect(() => {
    if (localValue) onUpdate(localValue);
  }, [localValue]);
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onEnterPress();
    }
  };
  const handleBlur = () => onUpdate(localValue);
  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue || ''}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-task-id={taskId}
      data-field-name={fieldName}
      className={`${validator ? 'border border-red-600' : 'border-none'} focus:outline-none w-full h-full p-1 rounded text-[12px] bg-transparent`}
    />
  );
};

const formatDate = (input) => {
  if (!input) return '';
  const d = new Date(input);
  return d.toISOString().split('T')[0];
};

const DateEditor = ({
  value: propValue,
  onUpdate,
  isNewRow,
  onEnterPress,
  className,
  placeholder = 'Select date',
  validator,
  min,
  max,
}) => {
  const [date, setDate] = useState(formatDate(propValue));
  const inputRef = useRef(null);
  useEffect(() => setDate(formatDate(propValue)), [propValue]);
  const performUpdate = (dateValue) => onUpdate(dateValue || null);
  const handleInputChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    performUpdate(newDate);
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      performUpdate(date);
      if (onEnterPress) onEnterPress();
    }
  };
  const handleBlur = () => performUpdate(date);
  const handleInputClick = () => {
    if (inputRef.current && typeof inputRef.current.showPicker === 'function') {
      try {
        inputRef.current.showPicker();
      } catch (error) {
        console.error('Error showing picker:', error);
      }
    }
  };
  const isInvalid = typeof validator === 'function' ? !validator(date) : false;
  return (
    <input
      ref={inputRef}
      type="date"
      value={date}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleInputClick}
      className={`${isInvalid ? 'border border-red-400' : 'border-none'} w-full focus:outline-none bg-transparent rounded text-[12px] p-1 ${className || ''}`}
      placeholder={placeholder}
      min={min}
      max={max}
    />
  );
};

const calculateDuration = (start, end) => {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Set end date to end of the day
  endDate.setHours(23, 59, 59, 999);

  // Check if task hasn't started yet
  if (now < startDate) {
    return { text: 'Not started', isOverdue: false };
  }

  // Calculate time differences (use absolute value to show overdue time)
  const diffMs = endDate - now;
  const absDiffMs = Math.abs(diffMs);
  const isOverdue = diffMs <= 0;

  // Calculate time differences
  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const timeStr = `${days > 0 ? days + 'd ' : '0d '}${remainingHours > 0 ? remainingHours + 'h ' : '0h '}${remainingMinutes > 0 ? remainingMinutes + 'm ' : '0m'}`;

  return {
    text: isOverdue ? `${timeStr}` : timeStr,
    isOverdue: isOverdue,
  };
};

// Live Timer Component that updates every second
const CountdownTimer = ({ startDate, targetDate }) => {
  const [countdown, setCountdown] = useState(calculateDuration(startDate, targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateDuration(startDate, targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div
      className={`text-left text-[12px] ${countdown.isOverdue ? 'text-red-600 font-medium' : ''}`}
    >
      {countdown.text}
    </div>
  );
};

// Pause Reason Modal Component
const PauseReasonModal = ({ isOpen, onClose, onSubmit, isLoading, taskId }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please enter a reason for pausing the task');
      return;
    }
    onSubmit(reason, taskId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[30rem]">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Reason for Pause</h2>

        <div className="mb-6">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for pausing this task..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            rows="4"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : 'Pause Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Draggable Column Header Component
const DraggableColumnHeader = ({ header, onReorderColumns, columnOrder }) => {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: 'column',
      item: { id: header.id },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    []
  );

  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: 'column',
      hover: (item) => {
        if (item.id !== header.id) {
          onReorderColumns(item.id, header.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [header.id, columnOrder]
  );

  const combinedRef = (el) => {
    dragRef(el);
    dropRef(el);
  };

  return (
    <th
      ref={combinedRef}
      style={{
        width: `${header.getSize()}px`,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isOver ? 'bg-gray-300' : 'bg-gray-300',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isOver ? 'scale(1.02)' : 'scale(1)',
      }}
      className={`border-r-2 p-2 text-center text-gray-600 bg-gray-300 font-semibold break-words cursor-move select-none ${
        isDragging ? 'shadow-lg' : ''
      } ${isOver ? 'bg-gray-300' : ''}`}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </th>
  );
};

// Helper function to calculate task status based on subtasks
const calculateTaskStatus = (task) => {
  if (!task.sub_tasks_managements || task.sub_tasks_managements.length === 0) {
    return task.status; // No subtasks, keep current status
  }

  const subtasks = task.sub_tasks_managements;
  const statuses = subtasks.map((st) => st.status?.toLowerCase() || 'open');

  // Priority 1: If any subtask is on_hold, task is on_hold
  if (statuses.some((status) => status === 'on_hold' || status === 'hold')) {
    return 'on_hold';
  }

  // Priority 2: If all subtasks are completed, task is completed
  if (statuses.every((status) => status === 'completed')) {
    return 'completed';
  }

  // Priority 3: If any subtask is in_progress, task is in_progress
  if (statuses.some((status) => status === 'in_progress' || status === 'progress')) {
    return 'in_progress';
  }

  // Default: task is open
  return 'open';
};

const processTaskData = (task) => {
  if (typeof task !== 'object' || task === null) {
    console.warn('Invalid task data encountered in processTaskData:', task);
    return {
      id: `invalid-${Math.random()}`,
      taskTitle: 'Invalid Task Data',
      status: 'error',
      hasSubtasks: false,
      subRows: [],
      subRowsLoaded: true,
    };
  }
  const hasSubtasks = task.sub_tasks_managements && task.sub_tasks_managements.length > 0;
  let subRows = [];
  if (hasSubtasks) {
    subRows = task.sub_tasks_managements.map((subTask) => processTaskData(subTask));
  }

  // Calculate task status based on subtasks
  const calculatedStatus = hasSubtasks ? calculateTaskStatus(task) : task.status;

  return {
    id: task.id,
    taskTitle: task.title || task.name || 'Unnamed Task',
    status: calculatedStatus,
    originalStatus: task.status, // Keep original for comparison
    responsiblePerson: task.responsible_person?.name || 'Unassigned',
    responsiblePersonId: task.responsible_person?.id || null,
    projectManagementId: task.project_management_id || 2,
    startDate: task.expected_start_date?.split('T')[0],
    endDate: task.target_date?.split('T')[0],
    priority: task.priority,
    duration: calculateDuration(task.expected_start_date, task.target_date),
    total_allocated_hours: `${task.total_allocated_hours} hours` || 0,
    predecessor: task.predecessor_task.length || 0,
    successor: task.successor_task.length || 0,
    is_started: task.is_started || false,
    is_Subtask: task.parent_id ? true : false,
    total_sub_task_count: Number(task.total_sub_tasks || 0),
    completed_sub_task_count: Number(task.completed_sub_tasks || 0),
    subTasks: (() => {
      const totalCount = Number(task.total_sub_tasks);
      const completedCount = Number(task.completed_sub_tasks);
      if (!totalCount || totalCount === 0) return 0;
      const percentage = Math.round((completedCount / totalCount) * 100);
      return percentage;
    })(),
    hasSubtasks,
    subRows,
    subRowsLoaded: true,
  };
};

const ProgressBar = ({ progressString, total = 0, completed = 0 }) => {
  const numericValue = parseInt(progressString, 10);
  const isValidPercentage = !isNaN(numericValue) && numericValue >= 0 && numericValue <= 100;
  return (
    <div className="progress-bar-container gap-1">
      {completed}
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${isValidPercentage ? numericValue : 0}%` }}
        ></div>
        <div className="progress-bar-label">
          {isValidPercentage ? `${numericValue}%` : 'Invalid Percentage'}
        </div>
      </div>
      {total}
    </div>
  );
};

const TaskTable = ({ isModalOpen, searchQuery, selectedColumns }) => {
  const token = localStorage.getItem('token');
  const { id, mid } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const isCloudRoute = useIsCloudRoute();
  const {
    loading: loadingTasks,
    error: tasksError,
    fetchTasks: tasksFromStore,
  } = useSelector((state) => state.fetchTasks);
  const { fetchProjectTeamMembers: projectTeamMembers } = useSelector(
    (state) => state.fetchProjectTeamMembers
  );
  const {
    fetchMyTasks: myTasksFromStore,
    loading: loadingMyTasks,
    error: myTasksError,
    success: myTaskSuccess,
  } = useSelector((state) => state.fetchMyTasks);
  const {
    fetchUsers: users,
    loading: loadingUsers,
    error: usersFetchError,
  } = useSelector((state) => state.fetchUsers || { users: [], loading: false, error: null });
  const {
    filterTask: filterTasks,
    loading: loadingFilterTasks,
    error: filterTasksError,
    success: filterSuccess,
  } = useSelector((state) => state.filterTask);
  const { fetchMilestoneById: milestone } = useSelector((state) => state.fetchMilestoneById);

  const userFetchInitiatedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastFetchedPageRef = useRef(null);
  const lastFetchedPathRef = useRef(location.pathname);
  const lastSearchRef = useRef(null);
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('open');
  const [newTaskResponsiblePersonId, setNewTaskResponsiblePersonId] = useState(null);
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('None');
  const [validator, setValidator] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const newTaskTitleInputRef = useRef(null);
  const newTaskFormRowRef = useRef(null);
  const [localError, setLocalError] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [members, setMembers] = useState([]);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseTaskId, setPauseTaskId] = useState(null);
  const [isPauseLoading, setIsPauseLoading] = useState(false);
  const [columnOrder, setColumnOrder] = useState(() => {
    // Load column order from local storage or use default
    const savedOrder = localStorage.getItem('taskTableColumnOrder');
    return savedOrder
      ? JSON.parse(savedOrder)
      : [
          'expander',
          'id',
          'taskTitle',
          'status',
          'responsiblePersonId',
          'startDate',
          'endDate',
          'duration',
          'total_allocated_hours',
          'subTasks',
          'priority',
          'predecessor',
          'successor',
        ];
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
    currentPage: 1,
  });
  const MIN_DISPLAY_ROWS = 10;
  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 40;

  useEffect(() => {
    if (!Array.isArray(projectTeamMembers)) {
      const members = [];

      projectTeamMembers?.project_team_members?.map((member) => {
        members.push(member.user);
      });
      members.push(projectTeamMembers?.team_lead);

      setMembers(members);
    }
  }, [projectTeamMembers]);

  const createNewTaskDefaults = useCallback(
    () => ({
      taskTitle: '',
      status: 'open',
      responsiblePersonId: null,
      startDate: '',
      endDate: '',
      priority: 'None',
    }),
    []
  );

  // Handle column reordering
  const handleReorderColumns = useCallback((draggedId, targetId) => {
    setColumnOrder((prevOrder) => {
      const draggedIndex = prevOrder.indexOf(draggedId);
      const targetIndex = prevOrder.indexOf(targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prevOrder;

      const newOrder = [...prevOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);

      // Save to local storage
      localStorage.setItem('taskTableColumnOrder', JSON.stringify(newOrder));

      return newOrder;
    });
  }, []);

  const handleFetchTasks = async () => {
    const myTasks = localStorage.getItem('myTasks');
    const page = pagination.pageIndex + 1;
    const searchParams = new URLSearchParams(location.search);
    const projectId = searchParams.get('project_id');
    if (localStorage.getItem('taskFilters')) {
      const saved = JSON.parse(localStorage.getItem('taskFilters'));
      const newFilter = {
        'q[status_in][]': saved.selectedStatuses.length > 0 ? saved.selectedStatuses : [],
        'q[created_by_id_eq]': saved.selectedCreators.length > 0 ? saved.selectedCreators : [],
        'q[start_date_eq]': saved.dates['Start Date'],
        'q[end_date_eq]': saved.dates['End Date'],
        'q[responsible_person_id_in][]':
          saved.selectedResponsible.length > 0 ? saved.selectedResponsible : [],
        'q[milestone_id_eq]': mid,
        page,
        ...(projectId && { 'q[project_management_id_eq]': projectId }),
      };
      const queryString = qs.stringify(newFilter, { arrayFormat: 'repeat' });
      await dispatch(filterTask({ token, filter: queryString })).unwrap();
      return;
    }
    if (localStorage.getItem('taskStatus')) {
      const saved = localStorage.getItem('taskStatus');
      const filter = {
        'q[status_eq]': saved,
        page,
        ...(projectId && { 'q[project_management_id_eq]': projectId }),
      };
      await dispatch(filterTask({ token, filter })).unwrap();
      return;
    }
    if (mid != undefined && mid != null) {
      if (projectId || searchQuery) {
        const filter = {
          'q[milestone_id_eq]': mid,
          page,
          ...(searchQuery && { 'q[title_cont]': searchQuery }),
          ...(projectId && { 'q[project_management_id_eq]': projectId }),
        };
        await dispatch(filterTask({ token, filter })).unwrap();
      } else {
        await dispatch(fetchTasks({ token, id: mid, page, search: searchQuery })).unwrap();
      }
    } else {
      if (myTasks === 'false') {
        if (projectId || searchQuery) {
          const filter = {
            page,
            ...(searchQuery && { 'q[title_cont]': searchQuery }),
            ...(projectId && { 'q[project_management_id_eq]': projectId }),
          };
          await dispatch(filterTask({ token, filter })).unwrap();
        } else {
          await dispatch(fetchTasks({ token, id: '', page, search: searchQuery })).unwrap();
        }
      } else {
        if (projectId || searchQuery) {
          const filter = {
            page,
            ...(searchQuery && { 'q[title_cont]': searchQuery }),
            ...(projectId && { 'q[project_management_id_eq]': projectId }),
          };
          await dispatch(filterTask({ token, filter })).unwrap();
        } else {
          // Include searchQuery when fetching "My Tasks" so user search works for their tasks
          await dispatch(fetchMyTasks({ token, page, search: searchQuery })).unwrap();
        }
      }
    }
  };

  const handleUpdateTaskFieldCell = useCallback(
    async (taskId, fieldName, newValue, taskRow) => {
      if (isUpdatingTask) return;
      const payload = { [fieldName]: newValue };
      setIsUpdatingTask(true);
      setLocalError(null);
      try {
        if (fieldName === 'status') {
          await dispatch(changeTaskStatus({ token, id: taskId, payload })).unwrap();

          // If this is a subtask, check and update parent task status
          if (taskRow && taskRow.depth > 0) {
            // This is a subtask, need to update parent task
            const parentTaskId = taskRow.parentId;
            if (parentTaskId) {
              // Fetch parent task data to recalculate status
              await handleFetchTasks();
            }
          }
        } else {
          await dispatch(updateTask({ token, id: taskId, payload })).unwrap();
        }
        lastFetchedPageRef.current = null;
        await handleFetchTasks();
      } catch (error) {
        console.error(`Task field update failed for ${taskId} (${fieldName}):`, error);
        setLocalError(
          `Update failed: ${error?.response?.data?.errors || error?.message || 'Server error'}`
        );
      } finally {
        setIsUpdatingTask(false);
      }
    },
    [dispatch, isUpdatingTask, token, handleFetchTasks]
  );

  const handlePauseTaskSubmit = useCallback(
    async (reason, tid) => {
      if (!tid) return;

      setIsPauseLoading(true);
      try {
        // Step 1: Update task status to "on_hold" (paused)
        const statusPayload = {
          status: 'stopped',
        };
        await dispatch(changeTaskStatus({ token, id: tid, payload: statusPayload })).unwrap();

        // Step 2: Create a comment with the pause reason for record keeping
        const commentPayload = {
          comment: {
            body: `Paused with reason: ${reason}`,
            commentable_id: tid,
            commentable_type: 'TaskManagement',
            commentor_id: JSON.parse(localStorage.getItem('user'))?.id,
            active: true,
          },
        };
        dispatch(createTaskComment({ token, payload: commentPayload }));

        toast.success('Task paused successfully with reason');
        setIsPauseModalOpen(false);
        setPauseTaskId(null);

        // Refresh task list
        lastFetchedPageRef.current = null;
        await handleFetchTasks();
      } catch (error) {
        console.error('Failed to pause task:', error);
        toast.error(
          `Failed to pause task: ${error?.response?.data?.errors || error?.message || 'Server error'}`
        );
      } finally {
        setIsPauseLoading(false);
      }
    },
    [token, dispatch, handleFetchTasks]
  );

  // Add this new hook near the top of the TaskTable component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isModalOpen) return;
      // Check if click is outside the table
      const tableWrapper = document.querySelector('.table-wrapper');
      if (tableWrapper && !tableWrapper.contains(event.target)) {
        // Get any active editable fields
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
          // Find the closest row to get task data
          const row = activeElement.closest('tr');
          if (row) {
            const taskId = row.getAttribute('data-task-id');
            const fieldName = activeElement.getAttribute('data-field-name');
            const value = activeElement.value;

            if (taskId && fieldName && value !== undefined) {
              handleUpdateTaskFieldCell(taskId, fieldName, value);
            }
          }
          activeElement.blur();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleUpdateTaskFieldCell]);

  // Function to update parent task status based on subtasks via API
  const updateParentTaskStatus = useCallback(
    async (taskId, newStatus) => {
      try {
        const payload = {
          status: newStatus,
        };

        await axios.put(
          `${baseURL}/task_managements/${taskId}.json`,
          { task_management: payload },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(`Task ${taskId} status updated to ${newStatus}`);
      } catch (error) {
        console.error(`Error updating task ${taskId} status:`, error);
        toast.error('Failed to update task status.');
      }
    },
    [token]
  );

  // Function to check and update task statuses based on subtasks
  const checkAndUpdateTaskStatuses = useCallback(
    async (tasksData) => {
      const tasksToUpdate = [];

      tasksData.forEach((task) => {
        if (task.hasSubtasks && task.originalStatus !== task.status) {
          tasksToUpdate.push({
            id: task.id,
            oldStatus: task.originalStatus,
            newStatus: task.status,
          });
        }
      });

      // Update tasks via API if their status changed
      for (const task of tasksToUpdate) {
        await updateParentTaskStatus(task.id, task.newStatus);
      }
    },
    [updateParentTaskStatus]
  );

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        await dispatch(fetchProjectTeamMembers({ token, id })).unwrap();
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      }
    };
    fetchMembers();
  }, [dispatch, token, id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('taskFilters');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    setIsFiltered(filterSuccess);
  }, [filterSuccess, filterTasks]);

  useEffect(() => {
    const fetch = async () => {
      if (isCreatingTask || isUpdatingTask || isFetchingRef.current) return;

      // Reset pagination when route changes or search query changes
      if (location.pathname !== lastFetchedPathRef.current) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: 0,
          currentPage: 1,
        }));
        lastFetchedPathRef.current = location.pathname;
        lastFetchedPageRef.current = null;
        lastSearchRef.current = searchQuery;
      } else if (searchQuery !== lastSearchRef.current) {
        // New search term, reset to first page
        setPagination((prev) => ({
          ...prev,
          pageIndex: 0,
          currentPage: 1,
        }));
        lastFetchedPageRef.current = null;
        lastSearchRef.current = searchQuery;
      }

      const pageToFetch = pagination.pageIndex + 1;

      if (
        lastFetchedPageRef.current === pageToFetch &&
        lastFetchedPathRef.current === location.pathname
      )
        return;

      try {
        isFetchingRef.current = true;
        lastFetchedPageRef.current = pageToFetch;
        await handleFetchTasks();
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        isFetchingRef.current = false;
      }
    };
    fetch();
  }, [
    dispatch,
    isCreatingTask,
    isUpdatingTask,
    location.pathname,
    mid,
    token,
    pagination.pageIndex,
    handleFetchTasks,
  ]);

  useEffect(() => {
    if (
      !loadingUsers &&
      Array.isArray(users) &&
      users.length === 0 &&
      !usersFetchError &&
      !isCreatingTask &&
      !isUpdatingTask
    ) {
      if (!userFetchInitiatedRef.current) {
        dispatch(fetchUsers({ token }));
        userFetchInitiatedRef.current = true;
      }
    } else if (Array.isArray(users) && (users.length > 0 || usersFetchError)) {
      userFetchInitiatedRef.current = true;
    }
  }, [dispatch, users, loadingUsers, usersFetchError, isCreatingTask, isUpdatingTask, token]);

  useEffect(() => {
    if (isCreatingTask || isUpdatingTask) return;
    let newProcessedData = [];
    let totalPages = 1;
    let totalRecords = 0;
    let currentPage = 1;
    const myTasks = localStorage.getItem('myTasks');

    if (myTasks === 'false') {
      if (
        filterSuccess &&
        Array.isArray(filterTasks.task_managements) &&
        (localStorage.getItem('taskFilters') || localStorage.getItem('taskStatus'))
      ) {
        newProcessedData = filterTasks.task_managements.map((task) => processTaskData(task));
        totalPages = filterTasks.pagination?.total_pages || 1;
        totalRecords = filterTasks.pagination?.total_count || newProcessedData.length;
        currentPage = filterTasks.pagination?.current_page || 1;
      } else if (
        tasksFromStore &&
        Array.isArray(tasksFromStore.task_managements) &&
        tasksFromStore.task_managements.length > 0
      ) {
        newProcessedData = tasksFromStore.task_managements.map((task) => processTaskData(task));
        totalPages = tasksFromStore.pagination?.total_pages || 1;
        totalRecords = tasksFromStore.pagination?.total_count || newProcessedData.length;
        currentPage = tasksFromStore.pagination?.current_page || 1;
      }
    } else {
      if (
        filterSuccess &&
        Array.isArray(filterTasks) &&
        (localStorage.getItem('taskFilters') || localStorage.getItem('taskStatus'))
      ) {
        newProcessedData = filterTasks.map((task) => processTaskData(task));
        totalPages = filterTasks.pagination?.total_pages || 1;
        totalRecords = filterTasks.pagination?.total_count || newProcessedData.length;
        currentPage = filterTasks.pagination?.current_page || 1;
      } else if (myTaskSuccess && Array.isArray(myTasksFromStore.task_managements)) {
        newProcessedData = myTasksFromStore.task_managements.map((task) => processTaskData(task));
        totalPages = myTasksFromStore.pagination?.total_pages || 1;
        totalRecords = myTasksFromStore.pagination?.total_count || newProcessedData.length;
        currentPage = myTasksFromStore.pagination?.current_page || 1;
      }
    }

    setData(newProcessedData);

    // Check and update task statuses based on subtasks
    if (newProcessedData.length > 0) {
      checkAndUpdateTaskStatuses(newProcessedData);
    }

    setPagination((prev) => ({
      ...prev,
      totalPages,
      totalRecords,
      currentPage,
    }));
    setLocalError(null);
  }, [
    tasksFromStore,
    tasksError,
    isCreatingTask,
    isUpdatingTask,
    filterTasksError,
    filterTasks,
    myTasksFromStore,
    myTasksError,
    myTaskSuccess,
    filterSuccess,
    checkAndUpdateTaskStatuses,
  ]);

  useEffect(() => {
    if (isAddingNewTask && newTaskTitleInputRef.current) {
      newTaskTitleInputRef.current.focus();
    }
  }, [isAddingNewTask, filterTasks, tasksFromStore, isFiltered]);

  const resetNewTaskForm = useCallback(() => {
    const defaults = createNewTaskDefaults();
    setNewTaskTitle(defaults.taskTitle);
    setNewTaskStatus(defaults.status);
    setNewTaskResponsiblePersonId(defaults.responsiblePersonId);
    setNewTaskStartDate(defaults.startDate);
    setNewTaskEndDate(defaults.endDate);
    setNewTaskPriority(defaults.priority);
    setLocalError(null);
    setValidator(false);
  }, [createNewTaskDefaults]);

  const handleShowNewTaskForm = () => {
    if (isCreatingTask || isAddingNewTask || isUpdatingTask) return;
    resetNewTaskForm();
    setIsAddingNewTask(true);
  };

  const handleCancelNewTask = () => {
    setIsAddingNewTask(false);
    resetNewTaskForm();
  };

  const handleSaveNewTask = useCallback(() => {
    if (!newTaskTitle || newTaskTitle.trim() === '') {
      setLocalError('Task title is required');
      setValidator(true);
      return;
    }
    if (!newTaskStartDate) {
      setLocalError('Start date is required');
      setValidator(true);
      return;
    }
    if (!newTaskEndDate) {
      setLocalError('End date is required');
      setValidator(true);
      return;
    }
    const start = new Date(newTaskStartDate);
    const end = new Date(newTaskEndDate);
    const milestoneStart = milestone?.start_date ? new Date(milestone.start_date) : new Date();
    const milestoneEnd = milestone?.end_date ? new Date(milestone.end_date) : null;
    // if (start < milestoneStart) {
    //   setLocalError("Start date cannot be before milestone start date");
    //   setValidator(true);
    //   return;
    // }
    // if (milestoneEnd && start > milestoneEnd) {
    //   setLocalError("Start date cannot be after milestone end date");
    //   setValidator(true);
    //   return;
    // }
    if (end < start) {
      setLocalError('End date cannot be before start date');
      setValidator(true);
      return;
    }
    // if (milestoneEnd && end > milestoneEnd) {
    //   setLocalError("End date cannot be after milestone end date");
    //   setValidator(true);
    //   return;
    // }
    setLocalError(null);
    setValidator(false);
    const taskAttributes = {
      title: newTaskTitle.trim(),
      status: newTaskStatus,
      project_management_id: id,
      responsible_person_id: newTaskResponsiblePersonId,
      expected_start_date: newTaskStartDate || null,
      target_date: newTaskEndDate || null,
      priority: newTaskPriority,
      milestone_id: mid,
    };
    setIsCreatingTask(true);
    setIsAddingNewTask(false);
    dispatch(createTask({ token, payload: taskAttributes }))
      .unwrap()
      .then(() => {
        resetNewTaskForm();
        lastFetchedPageRef.current = null;
        setPagination((prev) => ({ ...prev, pageIndex: 0, currentPage: 1 }));
        return handleFetchTasks();
      })
      .catch((error) => {
        console.error('Task creation failed:', error);
        setLocalError(
          `Task creation failed: ${error?.response?.data?.errors || error?.message || 'Server error'}`
        );
        setIsAddingNewTask(true);
      })
      .finally(() => setIsCreatingTask(false));
  }, [
    dispatch,
    newTaskTitle,
    newTaskStatus,
    newTaskResponsiblePersonId,
    newTaskStartDate,
    newTaskEndDate,
    newTaskPriority,
    resetNewTaskForm,
    id,
    mid,
    token,
    milestone,
  ]);

  useEffect(() => {
    const handleClickOutsideNewTaskRow = (event) => {
      if (
        !isAddingNewTask ||
        !newTaskFormRowRef.current ||
        newTaskFormRowRef.current.contains(event.target)
      ) {
        return;
      }
      handleSaveNewTask();
    };
    if (isAddingNewTask) {
      document.addEventListener('mousedown', handleClickOutsideNewTaskRow);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideNewTaskRow);
  }, [isAddingNewTask, isCreatingTask, newTaskTitle, handleSaveNewTask, resetNewTaskForm]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (!isAddingNewTask) return;
      if (event.key === 'Escape') handleCancelNewTask();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isAddingNewTask, handleCancelNewTask]);

  const mainTableColumns = [
    {
      id: 'expander',
      header: () => null,
      size: 40,
      cell: ({ row }) => {
        const canExpand = row.original.hasSubtasks;
        return canExpand ? (
          <button
            onClick={row.getToggleExpandedHandler()}
            style={{ cursor: 'pointer', paddingLeft: `${row.depth * 1}rem` }}
            className="flex items-center justify-center w-full h-full"
            aria-label={row.getIsExpanded() ? 'Collapse' : 'Expand'}
          >
            {row.getIsExpanded() ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span
            style={{ paddingLeft: `${row.depth * 1 + 0.5}rem` }}
            className="flex items-center justify-center w-full h-full"
          ></span>
        );
      },
    },
    {
      accessorKey: 'id',
      header: 'Task Id',
      size: 100,
      cell: ({ getValue, row }) => {
        let originalId = String(getValue() || '');
        const isSubtask = row.original.is_Subtask;
        let displayId = originalId.startsWith('T-')
          ? originalId
          : `${isSubtask ? `S-${originalId}` : `T-${originalId}`}`;
        let linkIdPart = originalId.startsWith('T-') ? originalId.substring(2) : originalId;
        const taskPaths = getTaskPaths(id, mid, linkIdPart, isCloudRoute);
        const navigationPath = mid ? taskPaths.taskDetail : taskPaths.taskDetailSimple;
        return (
          <Link
            to={navigationPath}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline p-1 block"
            style={{ paddingLeft: `${row.depth * 1.5}rem` }}
          >
            <span>{displayId}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: 'taskTitle',
      header: 'Task Title',
      size: 200,
      cell: ({ getValue, row }) => {
        const [editTitle, setEditTitle] = useState(getValue());
        const [isPlayPauseLoading, setIsPlayPauseLoading] = useState(false);
        const isCompleted = row.original.status === 'completed';

        const handlePlayPauseClick = async (action) => {
          if (action === 'pause') {
            setPauseTaskId(row.original.id);
            setIsPauseModalOpen(true);
          } else {
            setIsPlayPauseLoading(true);
            try {
              const newStatus = action === 'play' ? 'started' : 'stopped';
              await handleUpdateTaskFieldCell(row.original.id, 'status', newStatus, row);
            } catch (error) {
              console.error(`Failed to ${action} task:`, error);
              toast.error(`Failed to ${action} task`);
            } finally {
              setIsPlayPauseLoading(false);
            }
          }
        };

        const isTaskStarted = row.original.is_started;
        const hasSubtasks = row.original.hasSubtasks;

        return (
          <div className="flex items-center gap-2 w-full">
            <EditableTextField
              value={editTitle}
              onUpdate={(title) => setEditTitle(title)}
              onEnterPress={() =>
                handleUpdateTaskFieldCell(row.original.id, 'title', editTitle, row)
              }
              data-task-id={row.original.id}
              data-field-name="title"
            />
            {!hasSubtasks &&
              (isTaskStarted ? (
                <button
                  onClick={() => handlePlayPauseClick('pause')}
                  disabled={isPlayPauseLoading || isCompleted}
                  className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
                  title="Pause task"
                >
                  <Pause size={13} className="text-orange-500" />
                </button>
              ) : (
                <button
                  onClick={() => handlePlayPauseClick('play')}
                  disabled={isPlayPauseLoading || isCompleted}
                  className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
                  title="Play task"
                >
                  <Play size={13} className="text-green-500" />
                </button>
              ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 150,
      cell: ({ getValue, row }) => (
        <StatusBadge
          status={getValue()}
          statusOptions={globalStatusOptions}
          onStatusChange={(newStatus) =>
            handleUpdateTaskFieldCell(row.original.id, 'status', newStatus, row)
          }
        />
      ),
    },
    {
      accessorKey: 'responsiblePersonId',
      header: 'Responsible Person',
      size: 150,
      cell: ({ getValue, row }) => (
        <SelectBox
          options={(members?.filter(Boolean).length > 0 ? members.filter(Boolean) : users)?.map(
            (user) => ({
              value: user?.id,
              label: user?.name || `${user?.firstname} ${user?.lastname}`,
            })
          )}
          value={getValue()}
          onChange={(newValue) =>
            handleUpdateTaskFieldCell(row.original.id, 'responsible_person_id', newValue, row)
          }
          table={true}
          className="w-full"
        />
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      size: 130,
      cell: ({ getValue, row }) => (
        <DateEditor
          value={getValue()}
          onUpdate={(date) =>
            handleUpdateTaskFieldCell(row.original.id, 'expected_start_date', date, row)
          }
          className="text-[12px]"
          min={row.original.startDate}
          max={row.original.endDate}
        />
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      size: 130,
      cell: ({ getValue, row }) => (
        <DateEditor
          value={getValue()}
          onUpdate={(date) => handleUpdateTaskFieldCell(row.original.id, 'target_date', date, row)}
          className="text-[12px]"
          min={row.original.startDate}
        />
      ),
    },
    {
      accessorKey: 'total_allocated_hours',
      header: 'Efforts Duration',
      size: 120,
      cell: ({ row }) => {
        return row.original.total_allocated_hours;
      },
    },
    {
      accessorKey: 'duration',
      header: 'Time Left',
      size: 120,
      cell: ({ row }) => (
        <CountdownTimer startDate={row.original.startDate} targetDate={row.original.endDate} />
      ),
    },
    {
      accessorKey: 'subTasks',
      header: 'Subtasks',
      size: 140,
      cell: (info) => (
        <ProgressBar
          progressString={info.getValue()}
          total={info.row.original.total_sub_task_count}
          completed={info.row.original.completed_sub_task_count}
        />
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 110,
      cell: ({ getValue, row }) => (
        <StatusBadge
          status={getValue()}
          statusOptions={globalPriorityOptions}
          onStatusChange={(newPriority) =>
            handleUpdateTaskFieldCell(row.original.id, 'priority', newPriority, row)
          }
        />
      ),
    },
    {
      accessorKey: 'predecessor',
      header: 'Predecessor',
      size: 100,
      cell: ({ getValue }) => <span className="text-xs">{getValue()}</span>,
    },
    {
      accessorKey: 'successor',
      header: 'Successor',
      size: 100,
      cell: ({ getValue }) => <span className="text-xs">{getValue()}</span>,
    },
  ];

  // Reorder columns based on columnOrder state
  const orderedColumns = columnOrder
    .map((columnId) =>
      mainTableColumns.find((col) => col.id === columnId || col.accessorKey === columnId)
    )
    .filter(Boolean)
    .filter((col) => {
      // If selectedColumns is empty or not provided, show all columns
      if (!selectedColumns || Object.keys(selectedColumns).length === 0) {
        return true;
      }
      const columnId = col.id || col.accessorKey;
      return selectedColumns[columnId] !== false;
    });

  const renderNewTaskRow = () => {
    const newTaskFields = {
      expander: (
        <td key="expander" className="p-0 align-middle border-r-2 text-gray-400">
          <div className="h-full w-full flex items-center px-1 justify-center">
            <X onClick={handleCancelNewTask} className="cursor-pointer" size={17} />
          </div>
        </td>
      ),
      id: (
        <td key="id" className="p-0 align-middle border-r-2 text-gray-400">
          <div className="h-full w-full flex items-center px-1">---</div>
        </td>
      ),
      taskTitle: (
        <td key="taskTitle" className="pl-2 p-0 align-middle border-r-2">
          <EditableTextField
            value={newTaskTitle}
            onUpdate={setNewTaskTitle}
            inputRef={newTaskTitleInputRef}
            isNewRow={true}
            onEnterPress={handleSaveNewTask}
            validator={!newTaskTitle || newTaskTitle.trim() === ''}
          />
        </td>
      ),
      status: (
        <td key="status" className="pl-2 p-0 align-middle border-r-2">
          <StatusBadge
            status={newTaskStatus}
            statusOptions={globalStatusOptions}
            onStatusChange={setNewTaskStatus}
          />
        </td>
      ),
      responsiblePersonId: (
        <td key="responsiblePersonId" className="p-0 align-middle border-r-2">
          <SelectBox
            options={(members?.filter(Boolean).length > 0 ? members.filter(Boolean) : users)?.map(
              (user) => ({
                value: user?.id,
                label: user?.name || `${user?.firstname} ${user?.lastname}`,
              })
            )}
            value={newTaskResponsiblePersonId}
            onChange={(selectedId) => setNewTaskResponsiblePersonId(selectedId)}
            placeholder="Select Person..."
            table={true}
          />
        </td>
      ),
      startDate: (
        <td key="startDate" className="p-0 align-middle border-r-2">
          <DateEditor
            value={newTaskStartDate}
            onUpdate={setNewTaskStartDate}
            isNewRow={true}
            onEnterPress={handleSaveNewTask}
            validator={(date) => {
              if (!date) return false;
              const start = new Date(date);
              const milestoneStart = milestone?.start_date
                ? new Date(milestone.start_date)
                : new Date();
              const milestoneEnd = milestone?.end_date ? new Date(milestone.end_date) : null;
              return (
                start >= milestoneStart &&
                (!milestoneEnd || start <= milestoneEnd) &&
                (!newTaskEndDate || start <= new Date(newTaskEndDate))
              );
            }}
            min={
              milestone?.start_date
                ? milestone.start_date.split('T')[0]
                : new Date().toISOString().split('T')[0]
            }
            max={milestone?.end_date?.split('T')[0] || undefined}
          />
        </td>
      ),
      endDate: (
        <td key="endDate" className="p-0 align-middle border-r-2">
          <DateEditor
            value={newTaskEndDate}
            onUpdate={setNewTaskEndDate}
            isNewRow={true}
            onEnterPress={handleSaveNewTask}
            className="text-[12px]"
            validator={(date) => {
              if (!date) return false;
              const end = new Date(date);
              const start = newTaskStartDate ? new Date(newTaskStartDate) : null;
              const milestoneEnd = milestone?.end_date ? new Date(milestone.end_date) : null;
              return (!start || end >= start) && (!milestoneEnd || end <= milestoneEnd);
            }}
            min={newTaskStartDate || milestone?.start_date?.split('T')[0]}
            max={milestone?.end_date?.split('T')[0] || undefined}
          />
        </td>
      ),
      duration: (
        <td key="duration" className="p-0 align-middle border-r-2 text-xs">
          <div className="h-full w-full flex items-center px-2">
            {calculateDuration(newTaskStartDate, newTaskEndDate).text}
          </div>
        </td>
      ),
      priority: (
        <td key="priority" className="p-0 pl-2 align-middle border-r-2">
          <StatusBadge
            status={newTaskPriority}
            statusOptions={globalPriorityOptions}
            onStatusChange={setNewTaskPriority}
          />
        </td>
      ),
      predecessor: <td key="predecessor" className="p-0 align-middle border-r-2"></td>,
      successor: <td key="successor" className="p-0 align-middle border-r-2"></td>,
    };

    return columnOrder.map((colId) => newTaskFields[colId] || null);
  };

  const renderPagination = () => {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.pageIndex;
    const maxButtons = 3;

    if (totalPages <= maxButtons) {
      return [...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => {
            lastFetchedPageRef.current = null;
            table.setPageIndex(i);
          }}
          className={`px-2 py-1 ${i === currentPage ? 'bg-gray-200 font-bold' : ''}`}
        >
          {i + 1}
        </button>
      ));
    }

    const pages = [];
    const startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);
    const adjustedStartPage =
      endPage === totalPages - 1 ? Math.max(0, totalPages - maxButtons) : startPage;

    pages.push(
      <button
        key={0}
        onClick={() => {
          lastFetchedPageRef.current = null;
          table.setPageIndex(0);
        }}
        className={`px-2 py-1 ${currentPage === 0 ? 'bg-gray-200 font-bold' : ''}`}
      >
        1
      </button>
    );

    if (adjustedStartPage > 1) {
      pages.push(
        <span key="start-ellipsis" className="px-1">
          ...
        </span>
      );
    }

    for (
      let i = Math.max(1, adjustedStartPage);
      i < Math.min(totalPages - 1, adjustedStartPage + maxButtons);
      i++
    ) {
      pages.push(
        <button
          key={i}
          onClick={() => {
            lastFetchedPageRef.current = null;
            table.setPageIndex(i);
          }}
          className={`px-2 py-1 ${i === currentPage ? 'bg-gray-200 font-bold' : ''}`}
        >
          {i + 1}
        </button>
      );
    }

    if (adjustedStartPage + maxButtons < totalPages - 1) {
      pages.push(
        <span key="end-ellipsis" className="px-1">
          ...
        </span>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages - 1}
          onClick={() => {
            lastFetchedPageRef.current = null;
            table.setPageIndex(totalPages - 1);
          }}
          className={`px-2 py-1 ${currentPage === totalPages - 1 ? 'bg-gray-200 font-bold' : ''}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  const table = useReactTable({
    data,
    columns: orderedColumns,
    state: { expanded, pagination },
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const showTopLevelAddTaskButton =
    !isAddingNewTask && !isCreatingTask && !isUpdatingTask && !loadingTasks && !tasksError;
  const actualDataRows = table.getRowModel().rows;
  let displayedRowCount = actualDataRows.length + (isAddingNewTask ? 1 : 0);
  if (showTopLevelAddTaskButton && !isAddingNewTask) displayedRowCount++;
  const numEmptyRowsToFill = Math.max(0, MIN_DISPLAY_ROWS - displayedRowCount);
  const totalRowsForHeightCalc = Math.max(MIN_DISPLAY_ROWS, displayedRowCount);
  const desiredTableHeight = totalRowsForHeightCalc * ROW_HEIGHT + HEADER_HEIGHT;

  const newTskEnterKeyHandler = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveNewTask();
    }
  };

  let content;
  if (isCreatingTask || isUpdatingTask || loadingFilterTasks || loadingMyTasks || loadingTasks) {
    let loadingMessage = 'Loading tasks...';
    if (isCreatingTask) loadingMessage = 'Creating task...';
    if (isUpdatingTask) loadingMessage = 'Updating task...';
    if (loadingFilterTasks) loadingMessage = 'Filtering tasks...';
    content = <Loader message={loadingMessage} error={tasksError} />;
  } else {
    content = (
      <>
        <div
          className="table-wrapper border-none overflow-x-auto"
          style={{ maxHeight: '80vh', overflowY: 'auto' }}
        >
          <table className="w-full text-sm table-fixed">
            <thead className="sticky top-0 bg-gray-300 z-30">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-gray-300">
                  {hg.headers.map((h) => (
                    <DraggableColumnHeader
                      key={h.id}
                      header={h}
                      onReorderColumns={handleReorderColumns}
                      columnOrder={columnOrder}
                    />
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="!bg-white">
              {data.length === 0 &&
                !isAddingNewTask &&
                !loadingTasks &&
                !isCreatingTask &&
                !isUpdatingTask &&
                !loadingFilterTasks && (
                  <tr style={{ height: `${ROW_HEIGHT * 2}px` }}>
                    <td colSpan={mainTableColumns.length} className="text-center text-gray-500 p-4">
                      {isFiltered ? 'Try adjusting Filters' : ''} "No tasks available"
                    </td>
                  </tr>
                )}
              {table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    data-task-id={row.original.id}
                    className={`hover:bg-gray-50 ${row.getIsExpanded() ? 'bg-gray-100' : 'even:bg-[#D5DBDB4D]'} font-[300] relative z-1`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: `${cell.column.getSize()}px` }}
                        className="border-r-2 text-left pl-2 align-middle p-0"
                      >
                        <div className="h-full w-full flex items-center justify-center">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
              {isAddingNewTask && (
                <tr
                  ref={newTaskFormRowRef}
                  style={{ height: `${ROW_HEIGHT}px` }}
                  className="border-b relative z-1"
                >
                  {renderNewTaskRow()}
                </tr>
              )}
              {showTopLevelAddTaskButton && (
                <tr style={{ height: `${ROW_HEIGHT}px` }}>
                  <td colSpan={mainTableColumns.length} className="border text-left text-[12px]">
                    <button
                      onClick={handleShowNewTaskForm}
                      className="text-red-500 hover:underline text-sm px-2 py-1"
                    >
                      + Click here to add a new task
                    </button>
                  </td>
                </tr>
              )}
              {/* {Array.from({ length: numEmptyRowsToFill }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: `${ROW_HEIGHT}px` }}>
                  <td colSpan={mainTableColumns.length} className="border-r-2 p-2"></td>
                </tr>
              ))} */}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  const renderError = localError ? (
    <div className="mt-2 p-2 text-red-700 text-sm">{String(localError)}</div>
  ) : null;

  if (usersFetchError && (!Array.isArray(users) || users.length === 0)) {
    console.error('Error fetching users for dropdown:', usersFetchError);
  }
  if (loadingUsers && (!Array.isArray(users) || users.length === 0)) {
    console.log('Loading users for dropdown...');
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-2">
        {renderError}
        {content}
        {data.length > 0 && !loadingTasks && (
          <div className="flex items-center justify-start gap-4 mt-4 text-[12px]">
            <button
              onClick={() => {
                lastFetchedPageRef.current = null;
                table.previousPage();
              }}
              disabled={!table.getCanPreviousPage()}
              className="text-red-600 disabled:opacity-30"
            >
              {'<'}
            </button>
            {renderPagination()}
            <button
              onClick={() => {
                lastFetchedPageRef.current = null;
                table.nextPage();
              }}
              disabled={!table.getCanNextPage()}
              className="text-red-600 disabled:opacity-30"
            >
              {'>'}
            </button>
            <span className="ml-4">
              Page {pagination.currentPage} of {pagination.totalPages} | Total Records:{' '}
              {pagination.totalRecords}
            </span>
          </div>
        )}
      </div>
      <PauseReasonModal
        isOpen={isPauseModalOpen}
        onClose={() => {
          setIsPauseModalOpen(false);
          setPauseTaskId(null);
        }}
        onSubmit={handlePauseTaskSubmit}
        isLoading={isPauseLoading}
        taskId={pauseTaskId}
      />
    </DndProvider>
  );
};

export default TaskTable;
