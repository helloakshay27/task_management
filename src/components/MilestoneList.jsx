import {
    useState,
    useMemo,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getPaginationRowModel,
} from "@tanstack/react-table";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchMilestone,
    createMilestone,
    deleteMilestone,
    resetMilestoneSuccess,
    updateMilestone,
} from "../redux/slices/milestoneSlice";
import { fetchUsers } from "../redux/slices/userSlice";
import "./Home/Projects/Table.css";
import Loader from "./Loader";
import { toast } from "react-hot-toast";
import StatusBadge from "./Home/Projects/statusBadge";
import SelectBox from "./SelectBox";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

const NewMilestoneTextField = ({
    value,
    onChange,
    onEnterPress,
    inputRef,
    placeholder,
    validator,
}) => {
    const handleKeyDown = (event) => {
        if (event.key === "Enter" && onEnterPress) {
            event.preventDefault();
            onEnterPress();
        }
    };
    return (
        <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value || ""}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            className={`${validator ? "border border-red-500" : "border-none"
                } w-full p-1 focus:outline-none rounded text-[13px] bg-none`}
        />
    );
};

const NewMilestoneDateEditor = ({
    value,
    onChange,
    onEnterPress,
    placeholder,
    validator,
    min,
}) => {
    const handleKeyDown = (event) => {
        if (event.key === "Enter" && onEnterPress) {
            event.preventDefault();
            onEnterPress();
        }
    };
    return (
        <input
            type="date"
            placeholder={placeholder}
            value={value || ""}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            className={`${validator ? "border border-red-500" : "border-none"
                } w-full p-1 focus:outline-none rounded text-[13px]`}
            min={min || null}
        />
    );
};

const ActionIcons = ({ row }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        const formatId = row.original.id.split("-")[1];
        setDeleting(true);
        setShowDeleteModal(false);

        try {
            const response = await dispatch(
                deleteMilestone({
                    id: formatId,
                    token: localStorage.getItem("token"),
                })
            ).unwrap();

            if (response?.error === "You are not authorized to delete this milestone") {
                toast.dismiss();
                toast.error("You cannot delete this milestone — unauthorized access.", {
                    icon: "🚫",
                });
            } else {
                await dispatch(
                    fetchMilestone({
                        token: localStorage.getItem("token"),
                        id,
                    })
                ).unwrap();
                toast.dismiss();
                toast.success("Milestone deleted successfully", {
                    iconTheme: {
                        primary: "red",
                        secondary: "white",
                    },
                });
            }
        } catch (err) {
            console.error("Delete error:", err);
            const message =
                err?.error === "You are not authorized to delete this milestone"
                    ? "You cannot delete this milestone."
                    : "Failed to delete milestone. Please try again.";
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
                <button
                    onClick={() => navigate(`${row.original.actualId}`)}
                    title="View Details"
                >
                    <OpenInFullIcon sx={{ fontSize: "1.2em" }} />
                </button>
                <button
                    onClick={handleDeleteClick}
                    title="Delete"
                    disabled={deleting}
                    className={deleting ? "opacity-50 cursor-not-allowed" : ""}
                >
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: "1.2em" }} />
                </button>
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
    const isValidPercentage =
        !isNaN(numericValue) && numericValue >= 0 && numericValue <= 100;
    return (
        <div className="progress-bar-container gap-1">
            {completed}
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${isValidPercentage ? numericValue : 0}%` }}
                ></div>
                <div className="progress-bar-label">
                    {isValidPercentage ? `${numericValue}%` : "Invalid Percentage"}
                </div>
            </div>
            {total}
        </div>
    );
};

const globalStatusOptions = [
    "open",
    "in_progress",
    "on_hold",
    "completed",
    "overdue",
];

// Draggable Column Header Component
const DraggableColumnHeader = ({ header, onReorderColumns, columnOrder }) => {
    const [{ isDragging }, dragRef] = useDrag(
        () => ({
            type: "column",
            item: { id: header.id },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }),
        []
    );

    const [{ isOver }, dropRef] = useDrop(
        () => ({
            accept: "column",
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
                width: header.getSize(),
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: isOver ? "bg-gray-300" : "bg-gray-300",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isOver ? "scale(1.02)" : "scale(1)",
            }}
            className={`bg-gray-300 px-3 py-3.5 text-gray-800 text-center font-[500] border-r-2 border-[#FFFFFF] sticky top-0 z-10 cursor-move select-none ${isDragging ? "shadow-lg" : ""
                } ${isOver ? "bg-gray-300" : ""}`}
        >
            {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
        </th>
    );
};

const MilestoneList = ({ searchQuery, selectedColumns }) => {
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const fixedRowsPerPage = 10;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        fetchMilestone: milestones,
        loading: fetchMilestonesLoading,
        error: fetchMilestonesError,
    } = useSelector((state) => state.fetchMilestone);

    const { loading: statusChangeLoading } = useSelector(
        (state) => state.updateMilestone
    );

    const { success } = useSelector((state) => state.createMilestone);

    const {
        fetchUsers: users,
        loading: loadingUsers,
        error: usersFetchError,
    } = useSelector(
        (state) => state.fetchUsers || { users: [], loading: false, error: null }
    );

    const [isAddingNewMilestone, setIsAddingNewMilestone] = useState(false);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
    const [newMilestoneStatus, setNewMilestoneStatus] = useState(
        globalStatusOptions[0]
    );
    const [newMilestoneOwner, setNewMilestoneOwner] = useState("");
    const [newMilestoneStartDate, setNewMilestoneStartDate] = useState("");
    const [newMilestoneEndDate, setNewMilestoneEndDate] = useState("");
    const [localError, setLocalError] = useState(null);
    const [isSavingNewMilestone, setIsSavingNewMilestone] = useState(false);
    const [validator, setValidator] = useState(null);
    const newMilestoneTitleInputRef = useRef(null);
    const newMilestoneFormRowRef = useRef(null);

    const [data, setData] = useState([]);
    const [columnOrder, setColumnOrder] = useState(() => {
        // Load column order from local storage or use default
        const savedOrder = localStorage.getItem("milestoneTableColumnOrder");
        return savedOrder
            ? JSON.parse(savedOrder)
            : ["id", "title", "status", "owner", "tasks", "startDate", "endDate", "actions"];
    });

    const transformedData = useMemo(() => {
        if (!milestones) return [];
        if (!Array.isArray(milestones)) {
            if (milestones?.data && Array.isArray(milestones.data)) {
                return milestones.data.map((milestone, index) =>
                    transformMilestone(milestone, index)
                );
            }
            console.warn("Milestones source is not an array:", milestones);
            return [];
        }
        if (milestones.length === 0) return [];

        return milestones.map((milestone, index) =>
            transformMilestone(milestone, index)
        );

        function transformMilestone(milestone, index) {
            try {
                return {
                    id: `M-${milestone.id?.toString() || `unknown-${index}`}`,
                    actualId: milestone.id?.toString() || `unknown-${index}`,
                    title: milestone.title || milestone.name || "Untitled",
                    status: milestone.status
                        ? milestone.status.charAt(0).toUpperCase() +
                        milestone.status.slice(1)
                        : "Unknown",
                    owner: milestone.owner_name || "Unassigned",
                    total_task_count: Number(milestone.total_tasks || 0),
                    completed_task_count: Number(milestone.completed_tasks || 0),
                    tasks: (() => {
                        const totalCount = Number(milestone.total_tasks);
                        const completedCount = Number(milestone.completed_tasks);

                        if (!totalCount || totalCount === 0) return 0;

                        const percentage = Math.round(
                            (completedCount / totalCount) * 100
                        );
                        return percentage;
                    })(),
                    startDate: milestone.start_date
                        ? new Date(milestone.start_date).toLocaleDateString("en-CA")
                        : "N/A",
                    endDate: milestone.end_date
                        ? new Date(milestone.end_date).toLocaleDateString("en-CA")
                        : "N/A",
                };
            } catch (error) {
                console.error(
                    `Error transforming milestone ${index}:`,
                    error,
                    "Milestone:",
                    milestone
                );
                return {
                    id: `M-error-${index}`,
                    actualId: `error-${index}`,
                    title: "Error Transforming Data",
                };
            }
        }
    }, [milestones]);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: fixedRowsPerPage,
    });

    useEffect(() => {
        dispatch(fetchUsers({ token }));
        if (id) {
            dispatch(fetchMilestone({ token, id }));
        }
    }, [dispatch, id]);

    // Search filtering
    useEffect(() => {
        if (!searchQuery || searchQuery.trim() === "") {
            setData(transformedData);
        } else {
            const lowerQuery = searchQuery.toLowerCase().trim();
            const filtered = transformedData.filter((milestone) => {
                return (
                    milestone.id?.toLowerCase().includes(lowerQuery) ||
                    milestone.title?.toLowerCase().includes(lowerQuery) ||
                    milestone.status?.toLowerCase().includes(lowerQuery) ||
                    milestone.owner?.toLowerCase().includes(lowerQuery)
                );
            });
            setData(filtered);
        }
    }, [transformedData, searchQuery]);

    const handleStatusChange = useCallback(
        async ({ id: rowId, name, payload: newValue }) => {
            const actualMilestoneId = rowId.replace("M-", "");
            const apiCompatibleValue =
                typeof newValue === "string" ? newValue.toLowerCase() : newValue;
            try {
                await dispatch(
                    updateMilestone({
                        token,
                        id: actualMilestoneId,
                        payload: { milestone: { [name]: apiCompatibleValue } },
                    })
                ).unwrap();
                dispatch(fetchMilestone({ token, id }));
            } catch (err) {
                console.error(
                    `Failed to update milestone ${name} for ID ${actualMilestoneId}:`,
                    err
                );
            }
        },
        [dispatch, id]
    );

    const EditableTitleCell = ({ row, getValue }) => {
        const [title, setTitle] = useState(getValue());
        const [edit, setEdit] = useState(false);

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
                    name: "title",
                    payload: title,
                });
            }
        };

        return (
            <span onDoubleClick={handleDoubleClick}>
                {edit ? (
                    <NewMilestoneTextField
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onEnterPress={handleSave}
                        onBlur={handleSave}
                    />
                ) : (
                    <span className="cursor-pointer" onClick={() => navigate(`${row.original.actualId}/tasks`)} onDoubleClick={handleDoubleClick}>
                        {title}
                    </span>
                )}
            </span>
        );
    };

    const resetNewMilestoneForm = useCallback(() => {
        setNewMilestoneTitle("");
        setNewMilestoneStatus(globalStatusOptions[0]);
        setNewMilestoneOwner("");
        setNewMilestoneStartDate("");
        setNewMilestoneEndDate("");
        setLocalError(null);
        setValidator(false);
    }, []);

    const handleShowNewMilestoneForm = useCallback(() => {
        resetNewMilestoneForm();
        setIsAddingNewMilestone(true);
    }, [resetNewMilestoneForm]);

    const handleCancelNewMilestone = useCallback(() => {
        setIsAddingNewMilestone(false);
        resetNewMilestoneForm();
    }, [resetNewMilestoneForm]);

    const handleSaveNewMilestone = useCallback(async () => {
        if (
            !newMilestoneTitle ||
            newMilestoneTitle.trim() === "" ||
            !newMilestoneStartDate ||
            !newMilestoneEndDate
        ) {
            setLocalError("Fill all required fields.");
            setValidator(true);
            return;
        }
        setLocalError(null);
        setIsSavingNewMilestone(true);
        setValidator(false);

        const milestonePayload = {
            title: newMilestoneTitle.trim(),
            status: newMilestoneStatus.toLowerCase(),
            owner_id: newMilestoneOwner || null,
            start_date: newMilestoneStartDate || null,
            end_date: newMilestoneEndDate || null,
            project_management_id: id,
        };

        try {
            await dispatch(
                createMilestone({
                    token,
                    payload: { milestone: milestonePayload },
                })
            ).unwrap();
            dispatch(fetchMilestone({ token, id }));
            handleCancelNewMilestone();
        } catch (error) {
            console.error("Failed to create milestone:", error);
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to save milestone.";
            setLocalError(errorMessage);
        } finally {
            setIsSavingNewMilestone(false);
        }
    }, [
        dispatch,
        handleCancelNewMilestone,
        newMilestoneTitle,
        newMilestoneStatus,
        newMilestoneOwner,
        newMilestoneStartDate,
        newMilestoneEndDate,
        id,
    ]);

    useEffect(() => {
        if (isAddingNewMilestone && newMilestoneTitleInputRef.current) {
            newMilestoneTitleInputRef.current.focus();
        }
    }, [isAddingNewMilestone]);

    useEffect(() => {
        if (success) {
            dispatch(resetMilestoneSuccess());
        }
    }, [success, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !isAddingNewMilestone ||
                isSavingNewMilestone ||
                !newMilestoneFormRowRef.current ||
                newMilestoneFormRowRef.current.contains(event.target)
            ) {
                return;
            }
            handleSaveNewMilestone();
        };

        if (isAddingNewMilestone) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [
        isAddingNewMilestone,
        isSavingNewMilestone,
        newMilestoneTitle,
        handleSaveNewMilestone,
        handleCancelNewMilestone,
    ]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (!isAddingNewMilestone) return;
            if (event.key === "Escape") {
                handleCancelNewMilestone();
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isAddingNewMilestone, handleCancelNewMilestone]);

    const userOptionsForSelectBox = useMemo(
        () => [
            { value: "", label: "Unassigned" },
            ...(Array.isArray(users)
                ? users.map((u) => ({
                    value: u.id,
                    label: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
                }))
                : []),
        ],
        [users]
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
            localStorage.setItem("milestoneTableColumnOrder", JSON.stringify(newOrder));

            return newOrder;
        });
    }, []);

    const rowHeight = 40;
    const headerHeight = 48;

    const allColumns = useMemo(
        () => [
            {
                accessorKey: "id",
                header: "Milestone ID",
                size: 120,
                cell: ({ getValue }) => (
                    <span className="text-blue-600 cursor-pointer" onClick={() => navigate(`${getValue().replace("M-", "")}`)}>{getValue()}</span>
                ),
            },
            {
                accessorKey: "title",
                header: "Milestone Title",
                size: 300,
                cell: ({ row, getValue }) => (
                    <EditableTitleCell row={row} getValue={getValue} />
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                size: 150,
                cell: (info) => (
                    <StatusBadge
                        statusOptions={globalStatusOptions.map(
                            (s) => s.charAt(0).toUpperCase() + s.slice(1)
                        )}
                        status={info.getValue()}
                        onStatusChange={(newStatus) => {
                            handleStatusChange({
                                id: info.row.original.id,
                                name: "status",
                                payload: newStatus,
                            });
                        }}
                    />
                ),
            },
            {
                accessorKey: "owner",
                header: "Owner",
                size: 180,
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "tasks",
                header: "Tasks",
                size: 130,
                cell: (info) => (
                    <ProgressBar
                        progressString={info.getValue()}
                        total={info.row.original.total_task_count}
                        completed={info.row.original.completed_task_count}
                    />
                ),
            },
            {
                accessorKey: "startDate",
                header: "Start Date",
                size: 120,
                cell: ({ getValue }) => {
                    const date = new Date(getValue());
                    return date.toLocaleDateString("en-GB");
                },
            },
            {
                accessorKey: "endDate",
                header: "End Date",
                size: 120,
                cell: ({ getValue }) => {
                    const date = new Date(getValue());
                    return date.toLocaleDateString("en-GB");
                },
            },
            {
                id: "actions",
                header: "Actions",
                size: 120,
                cell: ({ row }) => <ActionIcons row={row} />,
            },
        ],
        [handleStatusChange]
    );

    // Reorder columns based on columnOrder state
    const columns = columnOrder
        .map((columnId) => allColumns.find((col) => col.id === columnId || col.accessorKey === columnId))
        .filter(Boolean)
        .filter((col) => {
            // If selectedColumns is empty or not provided, show all columns
            if (!selectedColumns || Object.keys(selectedColumns).length === 0) {
                return true;
            }
            const columnId = col.id || col.accessorKey;
            return selectedColumns[columnId] !== false;
        });

    const renderNewMilestoneRow = () => {
        const newMilestoneFields = {
            id: (
                <td key="id" className="p-1 border-r-2 text-center text-gray-500 text-xs align-middle">
                    NEW
                </td>
            ),
            title: (
                <td key="title" className="p-0 border-r-2 align-middle">
                    <NewMilestoneTextField
                        inputRef={newMilestoneTitleInputRef}
                        value={newMilestoneTitle}
                        onChange={(e) => {
                            setNewMilestoneTitle(e.target.value);
                            if (localError) setLocalError(null);
                        }}
                        onEnterPress={handleSaveNewMilestone}
                        placeholder="Milestone Title"
                        validator={validator}
                    />
                </td>
            ),
            status: (
                <td key="status" className="p-1 border-r-2 align-middle">
                    <StatusBadge
                        statusOptions={globalStatusOptions.map(
                            (s) => s.charAt(0).toUpperCase() + s.slice(1)
                        )}
                        status={
                            newMilestoneStatus.charAt(0).toUpperCase() +
                            newMilestoneStatus.slice(1)
                        }
                        onStatusChange={(val) =>
                            setNewMilestoneStatus(val.toLowerCase())
                        }
                    />
                </td>
            ),
            owner: (
                <td key="owner" className="p-0 border-r-2 align-middle">
                    <SelectBox
                        options={userOptionsForSelectBox}
                        value={newMilestoneOwner}
                        onChange={(selectedValue) =>
                            setNewMilestoneOwner(selectedValue)
                        }
                        table={true}
                        placeholder="Select Owner..."
                    />
                </td>
            ),
            tasks: (
                <td key="tasks" className="p-1 border-r-2 align-middle"></td>
            ),
            startDate: (
                <td key="startDate" className="p-0 border-r-2 align-middle">
                    <NewMilestoneDateEditor
                        value={newMilestoneStartDate}
                        onChange={(e) =>
                            setNewMilestoneStartDate(e.target.value)
                        }
                        onEnterPress={handleSaveNewMilestone}
                        validator={validator}
                        min={new Date().toISOString().split("T")[0]}
                    />
                </td>
            ),
            endDate: (
                <td key="endDate" className="p-0 border-r-2 align-middle">
                    <NewMilestoneDateEditor
                        value={newMilestoneEndDate}
                        onChange={(e) =>
                            setNewMilestoneEndDate(e.target.value)
                        }
                        onEnterPress={handleSaveNewMilestone}
                        validator={validator}
                        min={newMilestoneStartDate}
                    />
                </td>
            ),
            actions: (
                <td key="actions" className="p-1 border-r-2 text-center align-middle"></td>
            ),
        };

        return columnOrder.map((colId) => newMilestoneFields[colId] || null);
    };

    const table = useReactTable({
        data,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    let content;

    if (fetchMilestonesLoading || isSavingNewMilestone) {
        const loadingMessage = isSavingNewMilestone
            ? "Saving Milestone..."
            : "Loading Milestones...";
        content = <Loader message={loadingMessage} />;
    } else if (fetchMilestonesError || usersFetchError) {
        toast.dismiss();
        toast.error("Internal Server Error, Refresh Once");
    } else {
        content = (
            <div
                className="milestone-table-container text-[14px] font-light"
                style={{ minHeight: "200px" }}
            >
                {localError && isAddingNewMilestone && (
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
                            {data.length === 0 && !isAddingNewMilestone ? (
                                <tr style={{ height: `${rowHeight}px` }}>
                                    <td
                                        colSpan={columns.length}
                                        className="no-data-message text-center py-10 text-gray-500"
                                    >
                                        No milestones found.{" "}
                                        {searchQuery ? "Try adjusting search." : ""}
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
                                                className={`${cell.column.columnDef.meta?.cellClassName ||
                                                    ""
                                                    } whitespace-nowrap border-r-2 p-2 align-middle`}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                            {!isAddingNewMilestone && (
                                <tr>
                                    <td colSpan={columns.length} className="p-2 border-t-2">
                                        <button
                                            onClick={handleShowNewMilestoneForm}
                                            className="px-3 py-1.5 text-sm text-red-600 hover:underline"
                                            disabled={
                                                isSavingNewMilestone ||
                                                fetchMilestonesLoading ||
                                                loadingUsers ||
                                                statusChangeLoading
                                            }
                                        >
                                            + Add Milestone
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {isAddingNewMilestone && (
                                <tr
                                    ref={newMilestoneFormRowRef}
                                    className="bg-blue-50"
                                    style={{ height: `${rowHeight}px` }}
                                >
                                    {renderNewMilestoneRow()}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {data.length > 0 && (
                    <div className="flex items-center justify-start gap-4 mt-4 text-[12px]">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="text-red-600 disabled:opacity-30"
                        >
                            {"<"}
                        </button>

                        {(() => {
                            const totalPages = table.getPageCount();
                            const currentPage = table.getState().pagination.pageIndex;
                            const visiblePages = 3;

                            let start = Math.max(
                                0,
                                currentPage - Math.floor(visiblePages / 2)
                            );
                            let end = start + visiblePages;

                            if (end > totalPages) {
                                end = totalPages;
                                start = Math.max(0, end - visiblePages);
                            }

                            return [...Array(end - start)].map((_, i) => {
                                const page = start + i;
                                const isActive = page === currentPage;

                                return (
                                    <button
                                        key={page}
                                        onClick={() => table.setPageIndex(page)}
                                        className={`px-3 py-1 ${isActive ? "bg-gray-200 font-bold" : ""
                                            }`}
                                    >
                                        {page + 1}
                                    </button>
                                );
                            });
                        })()}

                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="text-red-600 disabled:opacity-30"
                        >
                            {">"}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="milestone-list-wrapper px-4 py-1">{content}</div>
        </DndProvider>
    );
};

export default MilestoneList;