import { useEffect, useState } from 'react';
import TaskActions from '../../components/Home/TaskActions.jsx';
import BoardsSection from '../../components/Home/BoardsSection.jsx';
import TasksList from '../../components/Home/Task/TasksList.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchProjectDetails } from '../../redux/slices/projectSlice.js';
import { fetchMilestoneById } from '../../redux/slices/milestoneSlice.js';

// Define available columns for Task table - must match mainTableColumns in Table.jsx
const TASK_TABLE_COLUMNS = [
  { id: 'expander', label: 'Expander', key: 'expander' },
  { id: 'id', label: 'Task Id', key: 'id' },
  { id: 'taskTitle', label: 'Task Title', key: 'taskTitle' },
  { id: 'status', label: 'Status', key: 'status' },
  { id: 'workflowStatus', label: 'Workflow Status', key: 'workflowStatus' },
  { id: 'responsiblePersonId', label: 'Responsible Person', key: 'responsiblePersonId' },
  { id: 'startDate', label: 'Start Date', key: 'startDate' },
  { id: 'endDate', label: 'End Date', key: 'endDate' },
  { id: 'duration', label: 'Duration', key: 'duration' },
  { id: 'total_allocated_hours', label: 'Effort Duration', key: 'total_allocated_hours' },
  { id: 'subTasks', label: 'Subtasks', key: 'subTasks' },
  { id: 'issues', label: 'Issues', key: 'issues' },
  { id: 'priority', label: 'Priority', key: 'priority' },
  { id: 'predecessor', label: 'Predecessor', key: 'predecessor' },
  { id: 'successor', label: 'Successor', key: 'successor' },
];

const Tasks = ({ setIsSidebarOpen }) => {
  const token = localStorage.getItem('token');
  const { id, mid } = useParams();
  const dispatch = useDispatch();

  const { fetchProjectDetails: project } = useSelector((state) => state.fetchProjectDetails);
  const { fetchMilestoneById: milestone } = useSelector((state) => state.fetchMilestoneById);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // debouncedSearchQuery updates after a short delay to avoid firing API calls on every keystroke
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const saved = localStorage.getItem('TaskTableColumns');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    dispatch(fetchProjectDetails({ token, id }));
    dispatch(fetchMilestoneById({ token, id: mid }));
  }, [dispatch]);

  const [selectedType, setSelectedType] = useState(() => {
    return localStorage.getItem('selectedTaskType') || 'List';
  });

  const handleColumnsChange = (columns) => {
    setSelectedColumns(columns);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <h3 className="text-[11px] text-gray-400 mx-6 my-4">
        {project?.title && milestone?.title
          ? `${project.title} / ${milestone.title} / Tasks`
          : 'Tasks'}
      </h3>
      <hr className="border border-gray-200" />

      <TaskActions
        setIsSidebarOpen={setIsSidebarOpen}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        addType={'Task'}
        context="Tasks"
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onColumnsChange={handleColumnsChange}
        availableColumns={TASK_TABLE_COLUMNS}
      />

      {selectedType === 'Kanban' ? (
        <BoardsSection section={'Tasks'} />
      ) : selectedType === 'List' ? (
        <TasksList
          isModalOpen={isModalOpen}
          searchQuery={debouncedSearchQuery}
          selectedColumns={selectedColumns}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default Tasks;
