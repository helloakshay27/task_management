import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StatusBadge from "../../components/Home/Projects/statusBadge";
import CustomTable from "../../components/Setup/CustomTable";
import {
    fetchSpirints,
    putSprint,
    postSprint,
} from "../../redux/slices/spirintSlice";
import { Link } from "react-router-dom";
import TaskActions from "../../components/Home/TaskActions";
import SprintGantt from "../../components/Sprints/SprintGantt";
import { fetchUsers } from "../../redux/slices/userSlice";

const globalStatusOptions = [
    "active",
    "in_progress",
    "completed",
    "stopped",
    // "overdue",
];

// Define available columns for Sprint table - must match columns in useMemo
const SPRINT_TABLE_COLUMNS = [
    { id: "id", label: "Sprint Id", key: "id" },
    { id: "name", label: "Sprint Title", key: "name" },
    { id: "status", label: "Status", key: "status" },
    { id: "sprint_owner_name", label: "Sprint Owner", key: "sprint_owner_name" },
    { id: "start_date", label: "Start Date", key: "start_date" },
    { id: "end_date", label: "End Date", key: "end_date" },
    { id: "duration", label: "Duration", key: "duration" },
    { id: "priority", label: "Priority", key: "priority" },
    { id: "associated_projects_count", label: "Number Of Projects", key: "associated_projects_count" },
];

const SprintTable = (setIsSidebarOpen) => {
    const token = localStorage.getItem("token");
    const dispatch = useDispatch();
    const {
        fetchSpirints: newSpirints,
        loading: sprintsLoading,
    } = useSelector((state) => state.fetchSpirints);

    const {
        fetchUsers: users,
        loading: usersLoading,
    } = useSelector((state) => state.fetchUsers);

    const {
        loading: createSprintLoading
    } = useSelector((state) => state.postSprint);

    const [data, setData] = useState([]);
    const [loaderMessage, setLoaderMessage] = useState("");
    const [selectedType, setSelectedType] = useState(() => {
        return localStorage.getItem("selectedSprintType") || "List";
    });
    const [selectedColumns, setSelectedColumns] = useState({});

    const handleColumnsChange = (columns) => {
        setSelectedColumns(columns);
    };

    const handlefetchSpirints = async () => {
        try {
            await dispatch(fetchSpirints({ token })).unwrap();
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (sprintsLoading || usersLoading) {
            setLoaderMessage("Loading...");
        } else if (createSprintLoading) {
            setLoaderMessage("Creating Sprint...");
        } else {
            setLoaderMessage("");
        }
    }, [sprintsLoading, usersLoading, createSprintLoading])

    const handleCreateSprints = async (payload) => {
        try {
            await dispatch(postSprint({ token, payload })).unwrap();
        } catch (error) {
            console.log(error);
        }
    };
    useEffect(() => {
        handlefetchSpirints();
        dispatch(fetchUsers({ token }));
    }, [dispatch]);

    useEffect(() => {
        if (newSpirints?.length) {
            setData(newSpirints);
        }
    }, [newSpirints]);

    const columns = useMemo(
        () => [
            {
                accessorKey: "id",
                header: "Sprint Id",
                size: 110,
                cell: ({ getValue, row }) => {
                    const originalId = String(getValue() || "");
                    let displayId = "";
                    let linkIdPart = originalId;

                    if (originalId.startsWith("S-")) {
                        displayId = originalId;
                        linkIdPart = originalId.substring(2);
                    } else {
                        displayId = `S-${originalId}`;
                    }

                    return (
                        <Link
                            to={`/sprint/sprintdetails/${linkIdPart}`}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline p-1 block"
                            style={{ paddingLeft: `${row.depth * 1.5}rem` }}
                        >
                            <span>{displayId}</span>
                        </Link>
                    );
                },
            },
            {
                accessorKey: "name",
                header: "Sprint Title",
                size: 250,
                cell: ({ getValue, row }) => {
                    const title = getValue();
                    const rawId = String(row.original.id || "");
                    const linkIdPart = rawId.startsWith("S-") ? rawId.substring(2) : rawId;

                    return (
                        <Link
                            to={`/sprint/${linkIdPart}`}
                            className="text-xs hover:underline p-1 block"
                            style={{ paddingLeft: `${row.depth * 1.5}rem` }}
                        >
                            <span>{title}</span>
                        </Link>
                    );
                },
            }
            ,
            {
                accessorKey: "status",
                header: "Status",
                size: 150,
                cell: (info) => (
                    <StatusBadge
                        statusOptions={globalStatusOptions.map(
                            (status) => status.charAt(0).toUpperCase() + status.slice(1)
                        )}
                        status={info.getValue()}
                        onStatusChange={(newStatus) => {
                            dispatch(
                                putSprint({
                                    token,
                                    id: info.row.original.id,
                                    payload: { status: newStatus.toLowerCase() },
                                })
                            );
                        }}
                    />
                ),
            },
            {
                accessorKey: "sprint_owner_name",
                header: "Sprint Owner",
                size: 150,

            },
            {
                accessorKey: "start_date",
                header: "Start Date",
                size: 180,
            },
            {
                accessorKey: "end_date",
                header: "End Date",
                size: 130,
            },
            {
                accessorKey: "end_date",
                header: "Duration",
                size: 150,
                cell: ({ row }) => {
                    const [countdown, setCountdown] = useState("");

                    useEffect(() => {
                        const updateCountdown = () => {
                            const now = new Date();
                            const endDate = new Date(row.original.end_date);

                            // Set to midnight of the day AFTER the end_date
                            const target = new Date(endDate);
                            target.setDate(endDate.getDate() + 1);
                            target.setHours(0, 0, 0, 0); // Midnight

                            const diff = target - now;

                            if (diff <= 0) {
                                setCountdown("00d:00h:00m:00s");
                                return;
                            }

                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                            const minutes = Math.floor((diff / (1000 * 60)) % 60);
                            const seconds = Math.floor((diff / 1000) % 60);

                            setCountdown(
                                `${String(days).padStart(2, "0")}d:${String(hours).padStart(2, "0")}h:${String(
                                    minutes
                                ).padStart(2, "0")}m:${String(seconds).padStart(2, "0")}s`
                            );
                        };

                        updateCountdown();
                        const interval = setInterval(updateCountdown, 1000);
                        return () => clearInterval(interval);
                    }, [row.original.end_date]);

                    return <span className="text-green-700 font-mono">{countdown}</span>;
                },
            },
            {
                accessorKey: "priority",
                header: "Priority",
                size: 100,
                cell: ({ getValue }) => {
                    const value = getValue();
                    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
                },
            },
            {
                accessorKey: "associated_projects_count",
                header: "Number Of Projects",
                size: 120,
            },
        ],
        [data]
    );

    // Filter columns based on selectedColumns
    const filteredColumns = columns.filter((col) => {
        if (!selectedColumns || Object.keys(selectedColumns).length === 0) {
            return true;
        }
        const columnId = col.id || col.accessorKey;
        return selectedColumns[columnId] !== false;
    });

    return (
        <>
            <TaskActions
                setIsSidebarOpen={setIsSidebarOpen}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                addType={"Sprint-Gantt"}
                context="Tasks"
                onColumnsChange={handleColumnsChange}
                availableColumns={SPRINT_TABLE_COLUMNS}
            />

            {selectedType === "Sprint-Gantt" ? (
                <SprintGantt />
            ) : selectedType === "List" ? (
                <CustomTable
                    data={data}
                    columns={filteredColumns}
                    layout="inline"
                    onAdd={() => setIsModalOpen(true)}
                    onCreateInlineItem={handleCreateSprints}
                    onRefreshInlineData={handlefetchSpirints}
                    loading={sprintsLoading || createSprintLoading || usersLoading}
                    loadingMessage={loaderMessage}
                    users={users || []}
                    isSprint={true}
                />
            ) : (
                <></>
            )}
        </>
    );
};

export default SprintTable;
