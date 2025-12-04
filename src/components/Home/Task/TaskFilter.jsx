import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { X, Search, ChevronRight, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";
import { filterTask } from "../../../redux/slices/taskSlice";
import { fetchStatus } from "../../../redux/slices/statusSlice";
import { useLocation, useParams } from "react-router-dom";
import qs from "qs";
import axios from "axios";
import { baseURL } from "../../../../apiDomain";

const colorOptions = [
    { label: "Open", color: "bg-[#c85e68]", value: "open" },
    { label: "In Progress", color: "bg-yellow-500", value: "in_progress" },
    { label: "Completed", color: "bg-green-400", value: "completed" },
    { label: "Overdue", color: "bg-red-500", value: "overdue" },
    { label: "On Hold", color: "bg-grey-500", value: "on_hold" },
    { label: "Abort", color: "bg-red-800", value: "abort" },
];

const TaskFilter = ({ isModalOpen, setIsModalOpen }) => {
    const token = localStorage.getItem("token");
    const { id, mid } = useParams();
    const modalRef = useRef(null);
    const location = useLocation();

    const getInitialFilters = () => {
        try {
            const saved = localStorage.getItem("taskFilters");
            return saved
                ? JSON.parse(saved)
                : {
                    selectedStatuses: [],
                    selectedResponsible: [],
                    selectedCreators: [],
                    selectedProjects: [],
                    selectedWorkflowStatus: [],
                    dates: { startDate: "", endDate: "" },
                    statusSearch: "",
                    workflowStatusSearch: "",
                    ResponsiblePersonSearch: "",
                    creatorSearch: "",
                    projectSearch: "",
                };
        } catch (error) {
            console.error("Error parsing taskFilters from localStorage:", error);
            return {
                selectedStatuses: [],
                selectedResponsible: [],
                selectedCreators: [],
                selectedProjects: [],
                selectedWorkflowStatus: [],
                dates: { startDate: "", endDate: "" },
                statusSearch: "",
                workflowStatusSearch: "",
                ResponsiblePersonSearch: "",
                creatorSearch: "",
                projectSearch: "",
            };
        }
    };

    const initialFilters = getInitialFilters();

    // Selected options
    const [selectedStatuses, setSelectedStatuses] = useState(initialFilters.selectedStatuses);
    const [selectedResponsible, setSelectedResponsible] = useState(initialFilters.selectedResponsible);
    const [selectedCreators, setSelectedCreators] = useState(initialFilters.selectedCreators);
    const [selectedProjects, setSelectedProjects] = useState(initialFilters.selectedProjects);
    const [selectedWorkflowStatus, setSelectedWorkflowStatus] = useState(initialFilters.selectedWorkflowStatus || []);
    const [dates, setDates] = useState(initialFilters.dates);
    const [responsiblePersonOptions, setResponsiblePersonOptions] = useState([]);
    const [createdByOptions, setCreatedByOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [projectOptions, setProjectOptions] = useState([]);
    const [workflowStatusOptions, setWorkflowStatusOptions] = useState([]);

    // Search inputs inside dropdowns
    const [statusSearch, setStatusSearch] = useState(initialFilters.statusSearch);
    const [workflowStatusSearch, setWorkflowStatusSearch] = useState(initialFilters.workflowStatusSearch || "");
    const [ResponsiblePersonSearch, setResponsiblePersonSearch] = useState(initialFilters.ResponsiblePersonSearch);
    const [creatorSearch, setCreatorSearch] = useState(initialFilters.creatorSearch);
    const [projectSearch, setProjectSearch] = useState(initialFilters.projectSearch);
    const [dropdowns, setDropdowns] = useState({
        status: false,
        ResponsiblePerson: false,
        startDate: false,
        endDate: false,
        createdBy: false,
        project: false,
        workflowStatus: false,
    });
    const dispatch = useDispatch();

    const {
        loading: loadingTasks,
        error: tasksError,
        fetchTasks: tasksFromStore,
    } = useSelector((state) => state.fetchTasks);

    const {
        tasks: filteredTasks,
    } = useSelector((state) => state.filterTask);

    const {
        fetchUsers: users,
        loading,
        error,
    } = useSelector(state => state.fetchUsers)

    const {
        fetchStatus: workflowStatuses,
    } = useSelector(state => state.fetchStatus)

    useEffect(() => {
        // Use filtered tasks if available, otherwise use all tasks
        const tasks = filteredTasks?.length > 0 ? filteredTasks : tasksFromStore;

        // Always show all available status options from colorOptions
        setStatusOptions(colorOptions);

        if (users?.length > 0) {
            setCreatedByOptions(users.map(user => ({ label: user.firstname + " " + user.lastname, value: user.id })));
            setResponsiblePersonOptions(users.map(user => ({ label: user.firstname + " " + user.lastname, value: user.id })));
        }

        // Map workflow statuses from Redux store
        if (workflowStatuses && Array.isArray(workflowStatuses)) {
            setWorkflowStatusOptions(
                workflowStatuses.map(status => ({
                    label: status.status || status.name,
                    value: status.id,
                }))
            );
        }
    }, [tasksFromStore, filteredTasks, users, workflowStatuses])

    // Fetch projects and workflow statuses from API
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get(`${baseURL}/project_managements.json`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.data && Array.isArray(response.data)) {
                    setProjectOptions(response.data.map(project => ({
                        label: project.name || project.title,
                        value: project.id
                    })));
                }
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };

        if (token) {
            fetchProjects();
            // Dispatch fetchStatus to get workflow statuses
            dispatch(fetchStatus({ token }));
        }
    }, [token, dispatch]);

    // Save filter state to localStorage whenever it changes
    useEffect(() => {
        const filters = {
            selectedStatuses,
            selectedResponsible,
            selectedCreators,
            selectedProjects,
            selectedWorkflowStatus,
            dates,
            statusSearch,
            workflowStatusSearch,
            ResponsiblePersonSearch,
            creatorSearch,
            projectSearch,
        };
        if (selectedStatuses?.length > 0 || selectedResponsible?.length > 0 || selectedCreators?.length > 0 || selectedProjects?.length > 0 || selectedWorkflowStatus?.length > 0 || dates.startDate || dates.endDate || statusSearch || ResponsiblePersonSearch || creatorSearch || projectSearch || workflowStatusSearch) {
            localStorage.setItem("taskFilters", JSON.stringify(filters));
        }
    }, [
        selectedStatuses,
        selectedResponsible,
        selectedCreators,
        selectedProjects,
        selectedWorkflowStatus,
        dates,
        statusSearch,
        workflowStatusSearch,
        ResponsiblePersonSearch,
        creatorSearch,
        projectSearch,
    ]);


    const handleApplyFilter = (overrideFilters) => {
        console.log(dates);
        try {
            const newFilter = {
                "q[status_in][]": selectedStatuses?.length > 0 ? selectedStatuses : [],
                "q[created_by_id_eq]": selectedCreators?.length > 0 ? selectedCreators : [],
                "q[start_date_eq]": dates.startDate,
                "q[end_date_eq]": dates.endDate,
                "q[responsible_person_id_in][]": selectedResponsible?.length > 0 ? selectedResponsible : [],
                "q[project_management_id_in][]": selectedProjects?.length > 0 ? selectedProjects : [],
                "q[project_status_id_in][]": selectedWorkflowStatus?.length > 0 ? selectedWorkflowStatus : [],
                "q[milestone_id_eq]": mid
            }
            if (newFilter) {
                const queryString = qs.stringify(newFilter, { arrayFormat: 'repeat' });

                dispatch(filterTask({ token, filter: overrideFilters ? overrideFilters : queryString }));
                setIsModalOpen(false);
            }
        } catch (e) {
            console.log(e);
        }
    }

    const toggleDropdown = (key) => {
        setDropdowns((prev) => {
            const isAlreadyOpen = prev[key];
            if (isAlreadyOpen) {
                return { ...prev, [key]: false };
            }
            return {
                status: false,
                ResponsiblePerson: false,
                createdBy: false,
                project: false,
                startDate: false,
                endDate: false,
                [key]: true,
            };
        });
    };

    // Toggle checkbox option selection
    const toggleOption = (value, selected, setSelected) => {
        setSelected((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    // Close modal animation
    const closeModal = () => {
        gsap.to(modalRef.current, {
            x: "100%",
            duration: 0.4,
            ease: "power3.in",
            onComplete: () => setIsModalOpen(false),
        });
    };

    // Open modal animation
    useGSAP(() => {
        if (isModalOpen) {
            gsap.fromTo(
                modalRef.current,
                { x: "100%" },
                { x: "0%", duration: 0.4, ease: "power3.out" }
            );
        }
    }, [isModalOpen]);

    // Render checkbox list with search filtering
    const renderCheckboxList = (options, selected, setSelected, searchTerm = "") => {
        const filtered = options.filter((opt) =>
            typeof opt === "string"
                ? opt.toLowerCase().includes(searchTerm.toLowerCase())
                : opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="max-h-40 overflow-y-auto p-2">
                {filtered.map((option) => {
                    const label = typeof option === "string" ? option : option.label;
                    const color = typeof option === "string" ? null : option.color;
                    const value = typeof option === "string" ? option : option.value

                    return (
                        <label
                            key={label}
                            className="flex items-center justify-between py-2 px-2 text-sm cursor-pointer hover:bg-gray-50 rounded"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(value)}
                                    onChange={() => toggleOption(value, selected, setSelected)}
                                />
                                <span>{label}</span>
                            </div>
                            {color && <span className={clsx("w-2 h-2 rounded-full", color)}></span>}
                        </label>
                    );
                })}
                {filtered?.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-2">No results found</div>
                )}
            </div>
        );
    };

    // Clear all selections and search inputs
    const clearAll = () => {
        setSelectedStatuses([]);
        setSelectedResponsible([]);
        setSelectedCreators([]);
        setSelectedProjects([]);
        setSelectedWorkflowStatus([]);
        setDates({ startDate: "", endDate: "" });
        setStatusSearch("");
        setWorkflowStatusSearch("");
        setResponsiblePersonSearch("");
        setCreatorSearch("");
        setProjectSearch("");
        localStorage.removeItem("taskFilters");
        handleApplyFilter({
            "q[milestone_id_eq]": mid
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black bg-opacity-50">
            <div
                ref={modalRef}
                className="bg-white w-full max-w-sm h-full shadow-xl flex flex-col relative"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b">
                    <h2 className="text-xl font-semibold">Filter</h2>
                    <X className="cursor-pointer" onClick={closeModal} />
                </div>

                <div className="px-6 py-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-red-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter search..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y">

                    {/* Project */}
                    {
                        !location.pathname.includes('projects') &&
                        <div className="p-6 py-3">
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleDropdown("project")}
                            >
                                <span className="font-medium text-sm select-none">Project</span>
                                {dropdowns.project ? (
                                    <ChevronDown className="text-gray-400" />
                                ) : (
                                    <ChevronRight className="text-gray-400" />
                                )}
                            </div>
                            {dropdowns.project && (
                                <div className="mt-4 border">
                                    <div className="relative border-b">
                                        <Search className="absolute left-3 top-2.5 text-red-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Filter project..."
                                            className="w-full pl-8 pr-4 py-2 text-sm border focus:outline-none"
                                            value={projectSearch}
                                            onChange={(e) => setProjectSearch(e.target.value)}
                                        />
                                    </div>
                                    {renderCheckboxList(projectOptions, selectedProjects, setSelectedProjects, projectSearch)}
                                </div>
                            )}
                        </div>
                    }
                    <div className="p-6 py-3">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleDropdown("status")}
                        >
                            <span className="font-medium text-sm select-none">Status</span>
                            {dropdowns.status ? (
                                <ChevronDown className="text-gray-400" />
                            ) : (
                                <ChevronRight className="text-gray-400" />
                            )}
                        </div>
                        {dropdowns.status && (
                            <div className="mt-4 border">
                                <div className="relative border-b">
                                    <Search className="absolute left-3 top-2.5 text-red-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filter status..."
                                        className="w-full pl-8 pr-4 py-2 text-sm border focus:outline-none"
                                        value={statusSearch}
                                        onChange={(e) => setStatusSearch(e.target.value)}
                                    />
                                </div>
                                {renderCheckboxList(statusOptions, selectedStatuses, setSelectedStatuses, statusSearch)}
                            </div>
                        )}
                    </div>

                    {/* Workflow Status */}
                    <div className="p-6 py-3">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleDropdown("workflowStatus")}
                        >
                            <span className="font-medium text-sm select-none">Workflow Status</span>
                            {dropdowns.workflowStatus ? (
                                <ChevronDown className="text-gray-400" />
                            ) : (
                                <ChevronRight className="text-gray-400" />
                            )}
                        </div>
                        {dropdowns.workflowStatus && (
                            <div className="mt-4 border">
                                <div className="relative border-b">
                                    <Search className="absolute left-3 top-2.5 text-red-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filter workflow status..."
                                        className="w-full pl-8 pr-4 py-2 text-sm border focus:outline-none"
                                        value={workflowStatusSearch}
                                        onChange={(e) => setWorkflowStatusSearch(e.target.value)}
                                    />
                                </div>
                                {renderCheckboxList(workflowStatusOptions, selectedWorkflowStatus, setSelectedWorkflowStatus, workflowStatusSearch)}
                            </div>
                        )}
                    </div>


                    {/* Responsible Person */}
                    <div className="p-6 py-3">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleDropdown("ResponsiblePerson")}
                        >
                            <span className="font-medium text-sm select-none">Responsible Person</span>
                            {dropdowns.ResponsiblePerson ? (
                                <ChevronDown className="text-gray-400" />
                            ) : (
                                <ChevronRight className="text-gray-400" />
                            )}
                        </div>
                        {dropdowns.ResponsiblePerson && (
                            <div className="mt-4 border">
                                <div className="relative border-b">
                                    <Search className="absolute left-3 top-2.5 text-red-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filter responsible person..."
                                        className="w-full pl-8 pr-4 py-2 text-sm border focus:outline-none"
                                        value={ResponsiblePersonSearch}
                                        onChange={(e) => setResponsiblePersonSearch(e.target.value)}
                                    />
                                </div>
                                {renderCheckboxList(responsiblePersonOptions, selectedResponsible, setSelectedResponsible, ResponsiblePersonSearch)}
                            </div>
                        )}
                    </div>



                    {/* Start Date and End Date */}
                    {/* {["startDate", "endDate"].map((key) => {
                        const label = key === "startDate" ? "Start Date" : "End Date";
                        return (
                            <div key={key} className="p-6 py-3">
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => toggleDropdown(key)}
                                >
                                    <span className="font-medium text-sm select-none">
                                        {label}
                                    </span>
                                    {dropdowns[key] ? (
                                        <ChevronDown className="text-gray-400" />
                                    ) : (
                                        <ChevronRight className="text-gray-400" />
                                    )}
                                </div>

                                {dropdowns[key] && (
                                    <div className="mt-4 px-1">
                                        <input
                                            type="date"
                                            value={dates[key]}
                                            onChange={(e) =>
                                                setDates((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                            className="w-full p-2 border rounded text-sm"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })} */}

                    {/* Created By */}
                    <div className="p-6 py-3">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleDropdown("createdBy")}
                        >
                            <span className="font-medium text-sm select-none">Created By</span>
                            {dropdowns.createdBy ? (
                                <ChevronDown className="text-gray-400" />
                            ) : (
                                <ChevronRight className="text-gray-400" />
                            )}
                        </div>
                        {dropdowns.createdBy && (
                            <div className="mt-4 border">
                                <div className="relative border-b">
                                    <Search className="absolute left-3 top-2.5 text-red-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filter created by..."
                                        className="w-full pl-8 pr-4 py-2 text-sm border focus:outline-none"
                                        value={creatorSearch}
                                        onChange={(e) => setCreatorSearch(e.target.value)}
                                    />
                                </div>
                                {renderCheckboxList(createdByOptions, selectedCreators, setSelectedCreators, creatorSearch)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center items-center gap-4 px-6 py-3 border-t">
                    <button
                        className="bg-[#C62828] text-white rounded px-10 py-2 text-sm font-semibold hover:bg-[#b71c1c]"
                        onClick={() => handleApplyFilter(null)}
                    >
                        Apply
                    </button>
                    <button
                        className="border border-[#C62828] text-[#C62828] rounded px-10 py-2 text-sm font-semibold hover:bg-red-50"
                        onClick={clearAll}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskFilter;