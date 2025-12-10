import { useState, useMemo, useEffect, useCallback, useRef, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjectPaths, useIsCloudRoute } from '../../../utils/navigationUtils';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import LoginTwoToneIcon from '@mui/icons-material/LoginTwoTone';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjects,
  changeProjectStatus,
  createProject,
  deleteProject,
  fetchProjectTypes,
  resetProjectSuccess,
  filterProjects,
} from '../../../redux/slices/projectSlice';
import qs from 'qs';
import { fetchUsers } from '../../../redux/slices/userSlice';
import StatusBadge from './statusBadge';
import './Table.css';
import Loader from '../../Loader';
import SelectBox from '../../SelectBox';
import { toast } from 'react-hot-toast';
import { DeleteConfirmationModal } from '../../DeleteConfirmationModal';

const NewProjectTextField = ({
  value,
  onChange,
  onEnterPress,
  inputRef,
  placeholder,
  className,
  validator,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && onEnterPress) {
      event.preventDefault();
      onEnterPress();
    }
  };
  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      className={`${
        validator ? 'border border-red-500' : 'border-none'
      } w-full p-1 focus:outline-none rounded text-[13px] bg-none`}
    />
  );
};

const NewProjectDateEditor = ({
  value,
  onChange,
  onEnterPress,
  placeholder,
  className,
  validator,
  min,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && onEnterPress) {
      event.preventDefault();
      onEnterPress();
    }
  };
  return (
    <input
      type="date"
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      className={`${
        validator ? 'border border-red-500' : 'border-none'
      } w-full p-1 focus:outline-none rounded text-[13px] ${className || ''}`}
      min={min || null}
    />
  );
};

const ActionIcons = ({ row }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isCloudRoute = useIsCloudRoute();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const projectPaths = getProjectPaths(row.original.actualId, isCloudRoute);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const formatId = row.original.id.split('-')[1];
    setDeleting(true);
    setShowDeleteModal(false);

    try {
      const response = await dispatch(
        deleteProject({ id: formatId, token: localStorage.getItem('token') })
      ).unwrap();

      if (response?.error === 'You are not authorized to delete this project') {
        toast.dismiss();
        toast.error('You cannot delete this project — unauthorized access.', {
          icon: '🚫',
        });
      } else {
        await dispatch(fetchProjects({ token: localStorage.getItem('token') })).unwrap();
        toast.dismiss();
        toast.success('Project deleted successfully', {
          iconTheme: {
            primary: 'red',
            secondary: 'white',
          },
        });
      }
    } catch (err) {
      console.error('Delete error:', err);
      const message =
        err?.error === 'You are not authorized to delete this project'
          ? 'You cannot delete this project.'
          : 'Failed to delete project. Please try again.';
      toast.dismiss();
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="action-icons flex justify-around items-center">
        <button onClick={() => navigate(projectPaths.project)} title="View Details">
          <OpenInFullIcon sx={{ fontSize: '1.2em' }} />
        </button>
        <button onClick={() => navigate(projectPaths.milestones)} title="View Tasks">
          <LoginTwoToneIcon sx={{ fontSize: '1.2em' }} />
        </button>
        {/* <button
                    onClick={handleDeleteClick}
                    title="Delete"
                    disabled={deleting}
                    className={deleting ? "opacity-50 cursor-not-allowed" : ""}
                >
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: "1.2em" }} />
                </button> */}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

const ProgressBar = ({ progressString, total = 0, completed = 0 }) => {
  const numericValue = parseInt(progressString, 10);
  console.log(numericValue);
  const isValidPercentage = !isNaN(numericValue) && numericValue >= 0 && numericValue <= 100;
  return (
    <div className="progress-bar-container gap-1 ">
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

const globalStatusOptions = ['active', 'in_progress', 'on_hold', 'completed', 'overdue'];

const globalPriorityOptionsForNew = ['Low', 'Medium', 'High', 'Urgent'];

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
      className={`bg-gray-300 px-3 py-3.5 text-gray-800 text-center font-[500] border-r-2 border-[#FFFFFF] sticky top-0 z-10 cursor-move select-none ${
        isDragging ? 'shadow-lg' : ''
      } ${isOver ? 'bg-gray-300' : ''}`}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </th>
  );
};

const ProjectList = ({ searchQuery, selectedColumns }) => {
  const token = localStorage.getItem('token');
  const dispatch = useDispatch();
  const isCloudRoute = useIsCloudRoute();

  const {
    fetchProjects: initialProjects,
    loading: fetchProjectsLoading,
    error: fetchProjectsError,
  } = useSelector((state) => state.fetchProjects);

  const {
    filterProjects: filteredProjects,
    success: filterProjectsSuccess,
    loading: filterProjectsLoadingRedux,
    error: filterProjectsErrorRedux,
  } = useSelector((state) => state.filterProjects);

  const { loading: statusChangeLoading, error: statusChangeError } = useSelector(
    (state) => state.changeProjectStatus
  );

  const { success } = useSelector((state) => state.createProject);

  const {
    fetchUsers: users,
    loading: loadingUsers,
    error: usersFetchError,
  } = useSelector((state) => state.fetchUsers || { users: [], loading: false, error: null });

  const { loading: deleteProjectLoading, error: deleteProjectError } = useSelector(
    (state) => state.deleteProject
  );

  const {
    fetchProjectTypes: projectTypes,
    loading: fetchProjectTypesLoading,
    error: fetchProjectTypesError,
  } = useSelector((state) => state.fetchProjectTypes);

  const [isAddingNewProject, setIsAddingNewProject] = useState(false);
  const [projectTypeOptions, setProjectTypeOptions] = useState([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState(globalStatusOptions[0]);
  const [newProjectType, setNewProjectType] = useState(
    projectTypeOptions.length > 0 ? projectTypeOptions[0] : ''
  );
  const [newProjectManager, setNewProjectManager] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectEndDate, setNewProjectEndDate] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState(globalPriorityOptionsForNew[0]);
  const [localError, setLocalError] = useState(null);
  const [isSavingNewProject, setIsSavingNewProject] = useState(false);
  const [validator, setValidator] = useState(null);
  const newProjectTitleInputRef = useRef(null);
  const newProjectFormRowRef = useRef(null);

  const [isFiltered, setIsFiltered] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    next_page: null,
    prev_page: null,
    total_pages: 1,
    total_count: 0,
  });
  const [columnOrder, setColumnOrder] = useState(() => {
    // Load column order from local storage or use default
    const savedOrder = localStorage.getItem('projectTableColumnOrder');
    return savedOrder
      ? JSON.parse(savedOrder)
      : [
          'id',
          'title',
          'status',
          'type',
          'manager',
          'milestones',
          'tasks',
          'subTasks',
          'issues',
          'startDate',
          'endDate',
          'priority',
          'actions',
        ];
  });

  useEffect(() => {
    if (
      !fetchProjectTypesLoading &&
      !fetchProjectTypesError &&
      (projectTypes.length == 0 || !Array.isArray(projectTypes))
    ) {
      dispatch(fetchProjectTypes({ token })).unwrap();
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(projectTypes) && projectTypes.length > 0) {
      setProjectTypeOptions(
        projectTypes.map((projectType) => ({
          label: projectType.name,
          value: projectType.id,
        }))
      );
    }
  }, [projectTypes]);

  useEffect(() => {
    filterProjectsSuccess ? setIsFiltered(true) : setIsFiltered(false);
  }, [filterProjectsSuccess, filteredProjects]);

  const transformedData = useMemo(() => {
    let projectsSource;
    let paginationData = {
      current_page: 1,
      next_page: null,
      prev_page: null,
      total_pages: 1,
      total_count: 0,
    };

    const hasFilter =
      isFiltered || localStorage.getItem('projectFilters') || localStorage.getItem('projectStatus');

    if (hasFilter) {
      projectsSource = filteredProjects?.length > 0 ? filteredProjects : [];
    } else {
      // Extract project_managements array and pagination from response
      if (initialProjects?.project_managements) {
        projectsSource = initialProjects.project_managements;
        paginationData = {
          current_page: initialProjects.pagination?.current_page || 1,
          next_page: initialProjects.pagination?.next_page || null,
          prev_page: initialProjects.pagination?.prev_page || null,
          total_pages: initialProjects.pagination?.total_pages || 1,
          total_count: initialProjects.pagination?.total_count || 0,
        };
      } else {
        projectsSource = initialProjects;
      }
    }

    // Update pagination state
    setPagination(paginationData);

    if (!projectsSource) return [];
    if (!Array.isArray(projectsSource)) {
      if (projectsSource?.data && Array.isArray(projectsSource.data)) {
        return projectsSource.data.map((project, index) => transformProject(project, index));
      }
      console.warn('Projects source is not an array:', projectsSource);
      return [];
    }
    if (projectsSource.length === 0) return [];

    return projectsSource.map((project, index) => transformProject(project, index));

    function transformProject(project, index) {
      try {
        return {
          id: `P-${project.id?.toString() || `unknown-${index}`}`,
          actualId: project.id?.toString() || `unknown-${index}`,
          title:
            project.title
              .replace(/@\[(.*?)\]\(\d+\)/g, '@$1')
              .replace(/#\[(.*?)\]\(\d+\)/g, '#$1') ||
            project.name
              .replace(/@\[(.*?)\]\(\d+\)/g, '@$1')
              .replace(/#\[(.*?)\]\(\d+\)/g, '#$1') ||
            project.project_title
              .replace(/@\[(.*?)\]\(\d+\)/g, '@$1')
              .replace(/#\[(.*?)\]\(\d+\)/g, '#$1') ||
            'Untitled',
          status: project.status
            ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
            : 'Unknown',
          type: project.project_type_name
            ? project.project_type_name.charAt(0).toUpperCase() + project.project_type_name.slice(1)
            : project.type
              ? project.type.charAt(0).toUpperCase() + project.type.slice(1)
              : '',

          manager: project.project_owner_name || project.manager || 'Unassigned',

          total_milestone_count: Number(project.total_milestone_count || 0),
          completed_milestone_count: Number(project.completed_milestone_count || 0),
          milestones: (() => {
            const totalCount = Number(project.total_milestone_count);
            const completedCount = Number(project.completed_milestone_count);

            if (!totalCount || totalCount === 0) return 0;

            const percentage = Math.round((completedCount / totalCount) * 100);
            return percentage;
          })(),

          total_task_management_count: Number(project.total_task_management_count || 0),
          completed_task_management_count: Number(project.completed_task_management_count || 0),
          tasks: (() => {
            const totalCount = Number(project.total_task_management_count);
            const completedCount = Number(project.completed_task_management_count);

            if (!totalCount || totalCount === 0) return 0;

            const percentage = Math.round((completedCount / totalCount) * 100);
            console.log(percentage);
            return percentage;
          })(),

          total_sub_task_count: Number(project.total_sub_task_management_count || 0),
          completed_sub_task_count: Number(project.completed_sub_task_management_count || 0),
          subTasks: (() => {
            const totalCount = Number(project.total_sub_task_management_count);
            const completedCount = Number(project.completed_sub_task_management_count);
            if (!totalCount || totalCount === 0) return 0;
            const percentage = Math.round((completedCount / totalCount) * 100);
            console.log(percentage);
            return percentage;
          })(),

          total_issues_count: Number(project.total_issues_count || 0),
          completed_issues_count: Number(project.completed_issues_count || 0),
          issues: (() => {
            const totalCount = Number(project.total_issues_count);
            const completedCount = Number(project.completed_issues_count);
            if (!totalCount || totalCount === 0) return 0;
            const percentage = Math.round((completedCount / totalCount) * 100);
            return percentage;
          })(),
          startDate: project.start_date
            ? new Date(project.start_date).toLocaleDateString('en-CA')
            : 'N/A',
          endDate: project.end_date
            ? new Date(project.end_date).toLocaleDateString('en-CA')
            : 'N/A',
          priority: project.priority
            ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1)
            : 'Unknown',
        };
      } catch (error) {
        console.error(`Error transforming project ${index}:`, error, 'Project:', project);
        return {
          id: `P-error-${index}`,
          actualId: `error-${index}`,
          title: 'Error Transforming Data',
        };
      }
    }
  }, [initialProjects, filteredProjects, isFiltered]);

  useEffect(() => {
    dispatch(fetchUsers({ token }));
    dispatch(fetchProjects({ token, page: 1 }));
  }, [dispatch]);

  // Updated useEffect to handle search filtering
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setData(transformedData);
    } else {
      const lowerQuery = searchQuery.toLowerCase().trim();
      const filtered = transformedData.filter((project) => {
        return (
          project.id?.toLowerCase().includes(lowerQuery) ||
          project.title?.toLowerCase().includes(lowerQuery) ||
          project.status?.toLowerCase().includes(lowerQuery) ||
          project.type?.toLowerCase().includes(lowerQuery) ||
          project.manager?.toLowerCase().includes(lowerQuery) ||
          project.priority?.toLowerCase().includes(lowerQuery)
        );
      });
      setData(filtered);
    }
  }, [transformedData, searchQuery]);

  const handleStatusChange = useCallback(
    async ({ id: rowId, name, payload: newValue }) => {
      const actualProjectId = rowId.replace('P-', '');
      const apiCompatibleValue = typeof newValue === 'string' ? newValue.toLowerCase() : newValue;
      try {
        await dispatch(
          changeProjectStatus({
            token,
            id: actualProjectId,
            payload: { project_management: { [name]: apiCompatibleValue } },
          })
        ).unwrap();
        if (localStorage.getItem('projectFilters')) {
          console.log('hoe');
          const saved = JSON.parse(localStorage.getItem('projectFilters'));
          const newFilters = {
            'q[status_in][]': saved.selectedStatuses, // Use array for multiple selections
            'q[owner_id_in][]': saved.selectedManagers,
            'q[created_by_id_in][]': saved.selectedCreators,
            'q[project_type_id_in][]': saved.selectedTypes,
            'q[title_cont]': '',
            'q[is_template_eq]': '',
            'q[start_date_eq]': saved.dates.startDate || '', // Ensure date is sent or empty string
            'q[end_date_eq]': saved.dates.endDate || '',
          };
          const queryString = qs.stringify(newFilters, {
            arrayFormat: 'repeat',
          });
          dispatch(filterProjects({ token, filters: queryString }));
        } else if (localStorage.getItem('projectStatus')) {
          const status = localStorage.getItem('projectStatus');
          const filter = {
            'q[status_eq]': status,
          };
          dispatch(filterProjects({ token, filters: filter }));
        } else {
          dispatch(fetchProjects({ token }));
        }
      } catch (err) {
        console.error(`Failed to update project ${name} for ID ${actualProjectId}:`, err);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('projectFilters');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    console.log('Resetting filters at', new Date().toISOString());

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const EditableTitleCell = ({ row, getValue }) => {
    const [title, setTitle] = useState(getValue());
    const [edit, setEdit] = useState(false);

    // Sync title with getValue() when row data changes
    useEffect(() => {
      setTitle(getValue());
    }, [getValue]);

    const handleDoubleClick = (e) => {
      e.preventDefault();
      setEdit(true);
    };

    const handleSave = () => {
      setEdit(false);
      if (title !== getValue()) {
        handleStatusChange({
          id: row.original.id,
          name: 'title',
          payload: title,
        });
      }
    };

    return (
      <span onDoubleClick={handleDoubleClick}>
        {edit ? (
          <NewProjectTextField
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onEnterPress={handleSave}
            onBlur={handleSave}
          />
        ) : (
          <Link
            to={getProjectPaths(row.original.actualId, isCloudRoute).milestones}
            className="cursor-pointer"
            onDoubleClick={handleDoubleClick}
          >
            {title}
          </Link>
        )}
      </span>
    );
  };

  const resetNewProjectForm = useCallback(() => {
    setNewProjectTitle('');
    setNewProjectStatus(globalStatusOptions[0]);
    setNewProjectType(projectTypeOptions[0]);
    setNewProjectManager('');
    setNewProjectStartDate('');
    setNewProjectEndDate('');
    setNewProjectPriority(globalPriorityOptionsForNew[0]);
    setLocalError(null);
    setValidator(false);
  }, [projectTypeOptions]);

  const handleShowNewProjectForm = useCallback(() => {
    resetNewProjectForm();
    setIsAddingNewProject(true);
  }, [resetNewProjectForm]);

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
      localStorage.setItem('projectTableColumnOrder', JSON.stringify(newOrder));

      return newOrder;
    });
  }, []);

  const handleCancelNewProject = useCallback(() => {
    setIsAddingNewProject(false);
    resetNewProjectForm();
  }, [resetNewProjectForm]);

  const handleSaveNewProject = useCallback(async () => {
    if (
      !newProjectTitle ||
      newProjectTitle.trim() === '' ||
      !newProjectStartDate ||
      !newProjectEndDate
    ) {
      setLocalError('Fill all required fields.');
      setValidator(true);
      return;
    }
    setLocalError(null);
    setIsSavingNewProject(true);
    setValidator(false);

    const projectPayload = {
      title: newProjectTitle.trim(),
      status: newProjectStatus.toLowerCase(),
      owner_id: newProjectManager || null,
      start_date: newProjectStartDate || null,
      end_date: newProjectEndDate || null,
      priority: newProjectPriority.toLowerCase(),
      project_type_id: newProjectType,
      active: 'true',
    };

    try {
      await dispatch(
        createProject({
          token,
          payload: { project_management: projectPayload },
        })
      ).unwrap();
      dispatch(fetchProjects({ token }));
      handleCancelNewProject();
    } catch (error) {
      console.error('Failed to create project:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to save project.';
      setLocalError(errorMessage);
    } finally {
      setIsSavingNewProject(false);
    }
  }, [
    dispatch,
    handleCancelNewProject,
    newProjectTitle,
    newProjectStatus,
    newProjectType,
    newProjectManager,
    newProjectStartDate,
    newProjectEndDate,
    newProjectPriority,
  ]);

  useEffect(() => {
    if (isAddingNewProject && newProjectTitleInputRef.current) {
      newProjectTitleInputRef.current.focus();
    }
  }, [isAddingNewProject]);

  useEffect(() => {
    if (success) {
      dispatch(resetProjectSuccess());
    }
  }, [success, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !isAddingNewProject ||
        isSavingNewProject ||
        !newProjectFormRowRef.current ||
        newProjectFormRowRef.current.contains(event.target)
      ) {
        return;
      }
      handleSaveNewProject();
    };

    if (isAddingNewProject) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    isAddingNewProject,
    isSavingNewProject,
    newProjectTitle,
    handleSaveNewProject,
    handleCancelNewProject,
  ]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (!isAddingNewProject) return;
      if (event.key === 'Escape') {
        handleCancelNewProject();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAddingNewProject, handleCancelNewProject]);

  const userOptionsForSelectBox = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...(Array.isArray(users)
        ? users.map((u) => ({
            value: u.id,
            label: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
          }))
        : []),
    ],
    [users]
  );

  const rowHeight = 40;
  const headerHeight = 48;

  const allColumns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'Project ID',
        size: 110,
        cell: ({ row, getValue }) => (
          <Link
            to={getProjectPaths(row.original.actualId, isCloudRoute).project}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {getValue()}
          </Link>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Project Title',
        size: 250,
        cell: ({ row, getValue }) => <EditableTitleCell row={row} getValue={getValue} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        cell: (info) => (
          <StatusBadge
            statusOptions={globalStatusOptions.map((s) => s.charAt(0).toUpperCase() + s.slice(1))}
            status={info.getValue()}
            onStatusChange={(newStatus) => {
              handleStatusChange({
                id: info.row.original.id,
                name: 'status',
                payload: newStatus,
              });
            }}
          />
        ),
      },
      {
        accessorKey: 'type',
        header: 'Project Type',
        size: 150,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'manager',
        header: 'Project Manager',
        size: 180,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'milestones',
        header: 'Milestones',
        size: 130,
        cell: (info) => (
          <ProgressBar
            progressString={info.getValue()}
            total={info.row.original.total_milestone_count}
            completed={info.row.original.completed_milestone_count}
          />
        ),
      },
      {
        accessorKey: 'tasks',
        header: 'Tasks',
        size: 110,
        cell: (info) => (
          <ProgressBar
            progressString={info.getValue()}
            total={info.row.original.total_task_management_count}
            completed={info.row.original.completed_task_management_count}
          />
        ),
      },
      {
        accessorKey: 'subTasks',
        header: 'Subtasks',
        size: 110,
        cell: (info) => (
          <ProgressBar
            progressString={info.getValue()}
            total={info.row.original.total_sub_task_count}
            completed={info.row.original.completed_sub_task_count}
          />
        ),
      },
      {
        accessorKey: 'issues',
        header: 'Issues',
        size: 100,
        cell: (info) => (
          <ProgressBar
            progressString={info.getValue()}
            total={info.row.original.total_issues_count}
            completed={info.row.original.completed_issues_count}
          />
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Start Date',
        size: 120,
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return date.toLocaleDateString('en-GB');
        },
      },
      {
        accessorKey: 'endDate',
        header: 'End Date',
        size: 120,
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return date.toLocaleDateString('en-GB');
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 100,
        cell: (info) => (
          <StatusBadge
            statusOptions={globalPriorityOptionsForNew}
            status={info.getValue()}
            onStatusChange={(newPriority) => {
              handleStatusChange({
                id: info.row.original.id,
                name: 'priority',
                payload: newPriority,
              });
            }}
          />
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 70,
        cell: ({ row }) => <ActionIcons row={row} />,
      },
    ],
    [handleStatusChange]
  );

  const renderPagination = () => {
    const totalPages = pagination.total_pages;
    const currentPage = pagination.current_page - 1; // Convert to 0-indexed
    const maxButtons = 3;

    if (totalPages <= maxButtons) {
      return [...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => {
            setTablePageIndex(i);
            dispatch(fetchProjects({ token, page: i + 1 }));
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
          setTablePageIndex(0);
          dispatch(fetchProjects({ token, page: 1 }));
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
            setTablePageIndex(i);
            dispatch(fetchProjects({ token, page: i + 1 }));
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
            setTablePageIndex(totalPages - 1);
            dispatch(fetchProjects({ token, page: totalPages }));
          }}
          className={`px-2 py-1 ${currentPage === totalPages - 1 ? 'bg-gray-200 font-bold' : ''}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  // Reorder columns based on columnOrder state
  const columns = columnOrder
    .map((columnId) =>
      allColumns.find((col) => col.id === columnId || col.accessorKey === columnId)
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

  const renderNewProjectRow = () => {
    const newProjectFields = {
      id: (
        <td key="id" className="p-1 border-r-2 text-center text-gray-500 text-xs align-middle">
          NEW
        </td>
      ),
      title: (
        <td key="title" className="p-0 border-r-2 align-middle">
          <NewProjectTextField
            inputRef={newProjectTitleInputRef}
            value={newProjectTitle}
            onChange={(e) => {
              setNewProjectTitle(e.target.value);
              if (localError) setLocalError(null);
            }}
            onEnterPress={handleSaveNewProject}
            placeholder="Project Title"
            validator={validator}
          />
        </td>
      ),
      status: (
        <td key="status" className="p-1 border-r-2 align-middle">
          <StatusBadge
            statusOptions={globalStatusOptions.map((s) => s.charAt(0).toUpperCase() + s.slice(1))}
            status={newProjectStatus.charAt(0).toUpperCase() + newProjectStatus.slice(1)}
            onStatusChange={(val) => setNewProjectStatus(val.toLowerCase())}
          />
        </td>
      ),
      type: (
        <td key="type" className="p-1 border-r-2 align-middle">
          <SelectBox
            options={projectTypeOptions}
            value={newProjectType}
            onChange={(selected) => setNewProjectType(selected)}
            table={true}
          />
        </td>
      ),
      manager: (
        <td key="manager" className="p-0 border-r-2 align-middle">
          <SelectBox
            options={userOptionsForSelectBox}
            value={newProjectManager}
            onChange={(selectedValue) => setNewProjectManager(selectedValue)}
            table={true}
            placeholder="Select Manager..."
          />
        </td>
      ),
      milestones: <td key="milestones" className="p-1 border-r-2 align-middle"></td>,
      tasks: <td key="tasks" className="p-1 border-r-2 align-middle"></td>,
      issues: <td key="issues" className="p-1 border-r-2 align-middle"></td>,
      startDate: (
        <td key="startDate" className="p-0 border-r-2 align-middle">
          <NewProjectDateEditor
            value={newProjectStartDate}
            onChange={(e) => setNewProjectStartDate(e.target.value)}
            onEnterPress={handleSaveNewProject}
            validator={validator}
            min={new Date().toISOString().split('T')[0]}
          />
        </td>
      ),
      endDate: (
        <td key="endDate" className="p-0 border-r-2 align-middle">
          <NewProjectDateEditor
            value={newProjectEndDate}
            onChange={(e) => setNewProjectEndDate(e.target.value)}
            onEnterPress={handleSaveNewProject}
            validator={validator}
            min={newProjectStartDate}
          />
        </td>
      ),
      priority: (
        <td key="priority" className="p-1 border-r-2 align-middle">
          <StatusBadge
            statusOptions={globalPriorityOptionsForNew}
            status={newProjectPriority}
            onStatusChange={(val) => setNewProjectPriority(val)}
          />
        </td>
      ),
      actions: <td key="actions" className="p-1 border-r-2 text-center align-middle"></td>,
    };

    return columnOrder.map((colId) => newProjectFields[colId] || null);
  };

  const [tablePageIndex, setTablePageIndex] = useState(0);

  const table = useReactTable({
    data,
    columns,
    state: { pagination: { pageIndex: tablePageIndex, pageSize: 10 } },
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === 'function'
          ? updater({ pageIndex: tablePageIndex, pageSize: 10 })
          : updater;
      setTablePageIndex(newState.pageIndex);
      const pageToFetch = newState.pageIndex + 1;
      dispatch(fetchProjects({ token, page: pageToFetch }));
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.total_pages,
  });

  let content;
  const anyFilterLoading = filterProjectsLoadingRedux;
  const anyFilterError = filterProjectsErrorRedux;

  if (fetchProjectsLoading || anyFilterLoading || isSavingNewProject) {
    const loadingMessage = isSavingNewProject
      ? 'Saving Project...'
      : fetchProjectsLoading
        ? 'Loading Projects...'
        : anyFilterLoading
          ? 'Applying Filters...'
          : 'Updating Status...';
    content = <Loader message={loadingMessage} />;
  } else if (fetchProjectsError || usersFetchError || anyFilterError || fetchProjectTypesError) {
    toast.dismiss();
    toast.error('Internal Server Error, Refresh Once');
  } else {
    content = (
      <div
        className="project-table-container text-[14px] font-light"
        style={{ minHeight: '200px' }}
      >
        {localError && isAddingNewProject && (
          <div className="mb-2 p-2 text-sm text-red-700">{localError}</div>
        )}
        <div className="table-wrapper overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-300">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <DraggableColumnHeader
                      key={header.id}
                      header={header}
                      onReorderColumns={handleReorderColumns}
                      columnOrder={columnOrder}
                    />
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {data.length === 0 && !isAddingNewProject ? (
                <tr style={{ height: `${rowHeight}px` }}>
                  <td
                    colSpan={columns.length}
                    className="no-data-message text-center py-10 text-gray-500"
                  >
                    No projects found.{' '}
                    {isFiltered || searchQuery ? 'Try adjusting filters or search.' : ''}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 even:bg-[#D5DBDB4D]"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`${
                          cell.column.columnDef.meta?.cellClassName || ''
                        } whitespace-nowrap border-r-2 p-2 align-middle`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!isAddingNewProject && (
                <tr>
                  <td colSpan={columns.length} className="p-2 border-t-2">
                    <button
                      onClick={handleShowNewProjectForm}
                      className="px-3 py-1.5 text-sm text-red-600 hover:underline"
                      disabled={
                        isSavingNewProject ||
                        fetchProjectsLoading ||
                        loadingUsers ||
                        anyFilterLoading ||
                        statusChangeLoading
                      }
                    >
                      + Add Project
                    </button>
                  </td>
                </tr>
              )}
              {isAddingNewProject && (
                <tr
                  ref={newProjectFormRowRef}
                  className="bg-blue-50"
                  style={{ height: `${rowHeight}px` }}
                >
                  {renderNewProjectRow()}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="flex items-center justify-start gap-4 mt-4 text-[12px]">
            <button
              onClick={() => {
                setTablePageIndex(tablePageIndex - 1);
                dispatch(fetchProjects({ token, page: pagination.prev_page }));
              }}
              disabled={!pagination.prev_page}
              className="text-red-600 disabled:opacity-30"
            >
              {'<'}
            </button>
            {renderPagination()}
            <button
              onClick={() => {
                setTablePageIndex(tablePageIndex + 1);
                dispatch(fetchProjects({ token, page: pagination.next_page }));
              }}
              disabled={!pagination.next_page}
              className="text-red-600 disabled:opacity-30"
            >
              {'>'}
            </button>
            <span className="ml-4">
              Page {pagination.current_page} of {pagination.total_pages} | Total Records:{' '}
              {pagination.total_count}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="project-list-wrapper px-4 py-1">{content}</div>
    </DndProvider>
  );
};

export default ProjectList;
