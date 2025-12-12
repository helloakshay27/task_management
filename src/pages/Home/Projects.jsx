import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { tabs } from '../../data/Data';
import TaskActions from '../../components/Home/TaskActions';
import ProjectList from '../../components/Home/Projects/ProjectList';
import BoardsSection from '../../components/Home/BoardsSection';
import { useNavigate } from 'react-router-dom';
import ProjectTemplates from '../Setup/ProjectTemplates';

// Define available columns for Project table - must match allColumns in ProjectList.jsx
const PROJECT_TABLE_COLUMNS = [
  { id: 'id', label: 'Project ID', key: 'id' },
  { id: 'title', label: 'Project Title', key: 'title' },
  { id: 'status', label: 'Status', key: 'status' },
  { id: 'type', label: 'Project Type', key: 'type' },
  { id: 'manager', label: 'Project Manager', key: 'manager' },
  { id: 'milestones', label: 'Milestones', key: 'milestones' },
  { id: 'tasks', label: 'Tasks', key: 'tasks' },
  { id: 'subtasks', label: 'Subtasks', key: 'subtasks' },
  { id: 'issues', label: 'Issues', key: 'issues' },
  { id: 'startDate', label: 'Start Date', key: 'startDate' },
  { id: 'endDate', label: 'End Date', key: 'endDate' },
  { id: 'priority', label: 'Priority', key: 'priority' },
  { id: 'actions', label: 'Actions', key: 'actions' },
];

const Projects = ({ setIsSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [activeTabLabel, setActiveTabLabel] = useState(tabs[0].id);
  const [selectedType, setSelectedType] = useState('List');
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const saved = localStorage.getItem('ProjectTableColumns');
    return saved ? JSON.parse(saved) : {};
  });

  const tabRefs = useRef({});
  const underlineRef = useRef(null);

  useGSAP(() => {
    if (tabRefs.current[activeTab] && underlineRef.current) {
      const tab = tabRefs.current[activeTab];
      const { offsetLeft, offsetWidth } = tab;

      gsap.to(underlineRef.current, {
        left: offsetLeft,
        width: offsetWidth,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [activeTab]);

  const handleColumnsChange = (columns) => {
    setSelectedColumns(columns);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="relative flex items-center mx-6 mt-3 mb-0 gap-10 text-sm">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(el) => (tabRefs.current[tab.id] = el)}
            className={`relative cursor-pointer text-[12px] pb-3 ${activeTab === tab.id ? 'text-[#C72030]' : 'text-gray-600'
              }`}
            onClick={() => {
              setActiveTab(tab.id);
              setActiveTabLabel(tab.id);
            }}
          >
            {tab.label}
          </div>
        ))}
        <div ref={underlineRef} className="absolute bottom-0 h-[2px] bg-[#C72030]" />
      </div>

      <hr className="border border-gray-200" />

      <TaskActions
        setIsSidebarOpen={setIsSidebarOpen}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        addType={activeTabLabel === 'active_projects' ? 'Project' : activeTabLabel}
        setFilters={setFilters}
        filters={filters}
        context={'Projects'}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onColumnsChange={handleColumnsChange}
        availableColumns={PROJECT_TABLE_COLUMNS}
      />

      {activeTab === tabs[0].id && (
        <>
          {selectedType === 'List' ? (
            <ProjectList searchQuery={searchQuery} selectedColumns={selectedColumns} />
          ) : (
            <BoardsSection section={'Projects'} />
          )}
        </>
      )}

      {activeTab === tabs[1].id && <ProjectTemplates />}
      {activeTab === tabs[2].id && <div>Tempelate</div>}
      {/* {
                activeTab === tabs[3].id && selectedType === "List" && (
                    <IssuesTable />
                )
            } */}
    </div>
  );
};

export default Projects;
