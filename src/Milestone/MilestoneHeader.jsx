import { useEffect } from 'react';
import TaskActions from '../components/Home/TaskActions';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectDetails } from '../redux/slices/projectSlice';
import { ArrowLeft } from 'lucide-react';

// Define available columns for Milestone table - must match allColumns in MilestoneList.jsx
const MILESTONE_TABLE_COLUMNS = [
    { id: 'id', label: 'Milestone ID', key: 'id' },
    { id: 'title', label: 'Milestone Title', key: 'title' },
    { id: 'status', label: 'Status', key: 'status' },
    { id: 'owner', label: 'Owner', key: 'owner' },
    { id: 'tasks', label: 'Tasks', key: 'tasks' },
    { id: 'issues', label: 'Issues', key: 'issues' },
    { id: 'startDate', label: 'Start Date', key: 'startDate' },
    { id: 'endDate', label: 'End Date', key: 'endDate' },
    { id: 'actions', label: 'Actions', key: 'actions' },
];

// Define available columns for Gantt view
const MILESTONE_GANTT_COLUMNS = [
    { id: 'actions', label: 'Actions', key: 'actions' },
    { id: 'text', label: 'Id', key: 'text' },
    { id: 'title', label: 'Milestone / Task Title', key: 'title' },
    { id: 'progress', label: 'Progress', key: 'progress' },
    { id: 'status', label: 'Status', key: 'status' },
];

const MilestoneHeader = ({
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    onColumnsChange,
}) => {
    const navigate = useNavigate()
    const token = localStorage.getItem('token');
    const { id } = useParams();
    const dispatch = useDispatch();

    const { fetchProjectDetails: project } = useSelector((state) => state.fetchProjectDetails);

    useEffect(() => {
        dispatch(fetchProjectDetails({ token, id }));
    }, [dispatch, id, token]);

    const handleColumnsChange = (columns) => {
        if (onColumnsChange) {
            onColumnsChange(columns);
        }
    };

    // Determine which columns to show based on selected type
    const availableColumnsForType =
        selectedType === 'Gantt' ? MILESTONE_GANTT_COLUMNS : MILESTONE_TABLE_COLUMNS;

    return (
        <div>
            <div className='flex items-center gap-4 mx-6 my-4'>
                <button onClick={() => navigate('/projects')}>
                    <ArrowLeft size={16} />
                </button>
                <h3 className="text-[11px] text-gray-400">{project.title} / Milestones</h3>
            </div>
            <hr className="border border-gray-200" />

            <TaskActions
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                addType={'Milestone'}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onColumnsChange={handleColumnsChange}
                availableColumns={availableColumnsForType}
            />
        </div>
    );
};

export default MilestoneHeader;
