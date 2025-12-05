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
  createTask,
  changeTaskStatus,
  updateTask,
  filterTask,
} from '../../../redux/slices/taskSlice';
import { fetchUsers } from '../../../redux/slices/userSlice';
import SelectBox from '../../SelectBox';
import Loader from '../../Loader';
import { useLocation } from 'react-router-dom';
import qs from 'qs';
import { X } from 'lucide-react';
import { DndProvider } from 'react-dnd';
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
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onEnterPress?.();
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
      onEnterPress?.();
    }
  };
  const handleBlur = () => performUpdate(date);
  const isInvalid = typeof validator === 'function' ? !validator(date) : false;
  return (
    <input
      ref={inputRef}
      type="date"
      value={date}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
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

  endDate.setHours(23, 59, 59, 999);

  if (now < startDate) {
    return { text: 'Not started', isOverdue: false };
  }

  const diffMs = endDate - now;
  const absDiffMs = Math.abs(diffMs);
  const isOverdue = diffMs <= 0;

  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  const timeStr = `${days > 0 ? days + 'd ' : '0d '}${remainingHours > 0 ? remainingHours + 'h ' : '0h '}${remainingMinutes > 0 ? remainingMinutes + 'm ' : '0m'}`;

  return {
    text: isOverdue ? `${timeStr}` : timeStr,
    isOverdue: isOverdue,
  };
};

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

const calculateTaskStatus = (task) => {
  if (!task.sub_tasks_managements || task.sub_tasks_managements.length === 0) {
    return task.status;
  }

  const subtasks = task.sub_tasks_managements;
  const statuses = subtasks.map((st) => st.status?.toLowerCase() || 'open');

  if (statuses.some((status) => status === 'on_hold' || status === 'hold')) {
    return 'on_hold';
  }

  if (statuses.every((status) => status === 'completed')) {
    return 'completed';
  }

  if (statuses.some((status) => status === 'in_progress' || status === 'progress')) {
    return 'in_progress';
  }

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

  const calculatedStatus = hasSubtasks ? calculateTaskStatus(task) : task.status;

  return {
    id: task.id,
    taskTitle: task.title || task.name || 'Unnamed Task',
    status: calculatedStatus,
    originalStatus: task.status,
    responsiblePerson: task.responsible_person?.name || 'Unassigned',
    responsiblePersonId: task.responsible_person?.id || null,
    projectManagementId: task.project_management_id || 2,
    startDate: task.expected_start_date?.split('T')[0],
    endDate: task.target_date?.split('T')[0],
    priority: task.priority,
    duration: calculateDuration(task.expected_start_date, task.target_date),
    predecessor: task.predecessor_task.length || 0,
    successor: task.successor_task.length || 0,
    hasSubtasks,
    subRows,
    subRowsLoaded: true,
  };
};

const ChatTasks = () => {
  const token = localStorage.getItem('token');
  const { id } = useParams();
  const dispatch = useDispatch();
  const location = useLocation().pathname;
  const isCloudRoute = useIsCloudRoute();

  const {
    filterTask: filterTasks,
    loading: loadingFilterTasks,
    error: filterTasksError,
    success: filterSuccess,
  } = useSelector((state) => state.filterTask);

  const {
    fetchUsers: users,
    loading: loadingUsers,
    error: usersFetchError,
  } = useSelector((state) => state.fetchUsers || { users: [], loading: false, error: null });

  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [localError, setLocalError] = useState(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
    currentPage: 1,
  });

  const ROW_HEIGHT = 30;

  const handleFetchTasksForChat = useCallback(async () => {
    if (!id) return;

    try {
      const filter = {
        ...(location.includes('messages') && { 'q[conversation_id_eq]': id }),
        ...(location.includes('groups') && { 'q[project_space_id_eq]': id }),
        page: 1,
      };
      const queryString = qs.stringify(filter);
      await dispatch(filterTask({ token, filter: queryString })).unwrap();
    } catch (error) {
      console.log('Error fetching chat tasks:', error);
      setLocalError('Failed to fetch tasks for this chat');
    }
  }, [dispatch, id, token]);

  const handleUpdateTaskFieldCell = useCallback(
    async (taskId, fieldName, newValue, taskRow) => {
      if (isUpdatingTask) return;

      const payload = { [fieldName]: newValue };
      setIsUpdatingTask(true);
      setLocalError(null);

      try {
        await dispatch(
          updateTask({ token, id: taskId, payload: { task_management: payload } })
        ).unwrap();
        await handleFetchTasksForChat();
      } catch (error) {
        console.log('Error updating task:', error);
        setLocalError('Failed to update task');
      } finally {
        setIsUpdatingTask(false);
      }
    },
    [dispatch, isUpdatingTask, token, handleFetchTasksForChat]
  );

  useEffect(() => {
    dispatch(fetchUsers({ token }));
    handleFetchTasksForChat();
  }, [dispatch, token, id, handleFetchTasksForChat]);

  useEffect(() => {
    if (!loadingFilterTasks && Array.isArray(filterTasks?.task_managements)) {
      const newProcessedData = filterTasks.task_managements.map((task) => processTaskData(task));
      setData(newProcessedData);
      setPagination((prev) => ({
        ...prev,
        totalPages: filterTasks.pagination?.total_pages || 1,
        totalRecords: filterTasks.pagination?.total_count || newProcessedData.length,
        currentPage: filterTasks.pagination?.current_page || 1,
      }));
    } else if (!loadingFilterTasks && Array.isArray(filterTasks)) {
      const newProcessedData = filterTasks.map((task) => processTaskData(task));
      setData(newProcessedData);
    }
    setLocalError(null);
  }, [filterTasks, loadingFilterTasks, filterTasksError]);

  useEffect(() => {
    if (!loadingUsers && Array.isArray(users) && users.length > 0) {
      setMembers(users);
    }
  }, [users, loadingUsers]);

  const mainTableColumns = [
    {
      accessorKey: 'id',
      header: 'Task Id',
      size: 100,
      cell: ({ getValue, row }) => {
        let originalId = String(getValue() || '');
        let displayId = originalId.startsWith('T-') ? originalId : `T-${originalId}`;
        let linkIdPart = originalId.startsWith('T-') ? originalId.substring(2) : originalId;
        const taskPaths = getTaskPaths('', '', linkIdPart, isCloudRoute);
        return (
          <Link
            to={taskPaths.taskDetailSimple}
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
        return (
          <EditableTextField
            value={editTitle}
            onUpdate={(title) => setEditTitle(title)}
            onEnterPress={() => handleUpdateTaskFieldCell(row.original.id, 'title', editTitle, row)}
            data-task-id={row.original.id}
            data-field-name="title"
          />
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
      size: 180,
      cell: ({ getValue, row }) => (
        <SelectBox
          options={users?.map((user) => ({
            value: user?.id,
            label: user?.name || `${user?.firstname} ${user?.lastname}`,
          }))}
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
      accessorKey: 'duration',
      header: 'Duration',
      size: 120,
      cell: ({ row }) => (
        <CountdownTimer startDate={row.original.startDate} targetDate={row.original.endDate} />
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

  const table = useReactTable({
    data,
    columns: mainTableColumns,
    state: { expanded, pagination },
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const actualDataRows = table.getRowModel().rows;
  const displayedRowCount = actualDataRows.length;

  let content;
  if (loadingFilterTasks) {
    content = <Loader message="Loading tasks..." error={filterTasksError} />;
  } else if (data.length === 0) {
    content = (
      <div className="p-4 text-center text-gray-500">No tasks found for this conversation</div>
    );
  } else {
    content = (
      <div className="p-2 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-300">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="border border-gray-300 pl-3 text-center text-gray-600 font-semibold break-words text-[12px]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {actualDataRows.map((row) => (
              <tr
                key={row.id}
                className="border border-gray-300 hover:bg-gray-50"
                style={{ height: ROW_HEIGHT }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: `${cell.column.getSize()}px` }}
                    className="border border-gray-300 pl-3 py-1 text-[12px]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const renderError = localError ? (
    <div className="mt-2 p-2 text-red-700 text-sm">{String(localError)}</div>
  ) : null;

  if (usersFetchError && (!Array.isArray(users) || users.length === 0)) {
    return <Loader message="Failed to load users" error={usersFetchError} />;
  }

  if (loadingUsers && (!Array.isArray(users) || users.length === 0)) {
    return <Loader message="Loading users..." error={null} />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-2">
        {renderError}
        {content}
        {data.length > 0 && !loadingFilterTasks && (
          <div className="flex items-center justify-start gap-4 mt-4 text-[12px]">
            <span className="ml-4">Total Records: {pagination.totalRecords}</span>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default ChatTasks;
