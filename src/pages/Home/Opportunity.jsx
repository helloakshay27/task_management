import { useMemo, useCallback, useState, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender
} from "@tanstack/react-table";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import StatusBadge from "@/components/Home/Projects/statusBadge";
import TaskActions from "@/components/Home/TaskActions";
import axios from "axios";
import { baseURL } from "../../../apiDomain";
import { useNavigate } from "react-router-dom";

// Status options
const globalStatusOptions = ["open", "in_progress", "completed", "on_hold"];

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
                width: header.getSize() ? `${header.getSize()}px` : undefined,
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: isOver ? "bg-gray-300" : "bg-gray-300",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isOver ? "scale(1.02)" : "scale(1)",
            }}
            className={`border p-2 bg-gray-300 text-center text-gray-700 font-semibold sticky top-0 cursor-move select-none ${isDragging ? "shadow-lg" : ""
                } ${isOver ? "bg-gray-300" : ""}`}
        >
            {flexRender(header.column.columnDef.header, header.getContext())}
        </th>
    );
};

const Opportunity = () => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate();

    const [columnOrder, setColumnOrder] = useState(() => {
        const savedOrder = localStorage.getItem("opportunityTableColumnOrder");
        return savedOrder
            ? JSON.parse(savedOrder)
            : [
                "id",
                "title",
                "project",
                "task",
                "status",
                "created_by",
                "created_at"
            ];
    });

    const [opportunities, setOpportunities] = useState([])
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState({});

    useEffect(() => {
        const fetchOpportunities = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${baseURL}/opportunities.json`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                setOpportunities(response.data || [])
            } catch (err) {
                console.error('Error fetching opportunities:', err);
                setError(err.message || 'Failed to fetch opportunities');
                setOpportunities([]);
            } finally {
                setLoading(false);
            }
        }
        fetchOpportunities()
    }, [token])

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
            localStorage.setItem("opportunityTableColumnOrder", JSON.stringify(newOrder));

            return newOrder;
        });
    }, []);

    // Handle column visibility changes
    const handleColumnsChange = useCallback((updatedColumns) => {
        setVisibleColumns(updatedColumns);
    }, []);

    const allColumns = useMemo(
        () => [
            {
                id: "id",
                accessorKey: "id",
                header: "ID",
                size: 60,
                cell: ({ getValue, row }) => (
                    <button
                        onClick={() => navigate(`/opportunity/${getValue()}`)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                    >
                        OPP-{getValue()}
                    </button>
                ),
            },
            {
                id: "title",
                accessorKey: "title",
                header: "Opportunity Name",
                size: 200,
                cell: ({ getValue }) => getValue(),
            },
            {
                id: "project",
                accessorKey: "project",
                header: "Project Name",
                size: 200,
                cell: ({ row }) => row.original?.project_management?.title || "Not Assigned",
            },
            {
                id: "task",
                accessorKey: "task",
                header: "Task Name",
                size: 200,
                cell: ({ row }) => row.original?.task_management?.title || "Not Assigned",
            },
            {
                id: "status",
                accessorKey: "status",
                header: "Status",
                size: 120,
                cell: ({ row }) => (
                    <StatusBadge
                        status={row.original.status}
                        statusOptions={globalStatusOptions}
                        onStatusChange={() => { }}
                        disabled={true}
                    />
                ),
            },
            {
                id: "created_by",
                accessorKey: "created_by",
                header: "Created By",
                size: 120,
                cell: ({ row }) => (
                    <StatusBadge
                        status={row.original.created_by.name}
                        statusOptions={globalStatusOptions}
                        onStatusChange={() => { }}
                        disabled={true}
                    />
                ),
            },
            {
                id: "created_at",
                accessorKey: "created_at",
                header: "Created On",
                size: 120,
                cell: ({ row }) => (
                    <StatusBadge
                        status={row.original.created_at.split("T")[0]}
                        statusOptions={globalStatusOptions}
                        onStatusChange={() => { }}
                        disabled={true}
                    />
                ),
            },
        ],
        []
    );

    // Available columns for the column selector
    const availableColumns = useMemo(
        () => allColumns.map(col => ({
            id: col.id,
            label: col.header,
            key: col.id
        })),
        [allColumns]
    );

    // Reorder columns based on columnOrder state
    const columns = columnOrder
        .map((columnId) =>
            allColumns.find((col) => col.id === columnId || col.accessorKey === columnId)
        )
        .filter(col => {
            // If no visibility settings, show all columns
            if (Object.keys(visibleColumns).length === 0) return Boolean(col);
            // Otherwise, filter based on visibility
            return visibleColumns[col?.id] !== false;
        })
        .filter(Boolean);

    const table = useReactTable({
        data: opportunities,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        pageCount: Math.ceil(opportunities.length / pagination.pageSize),
        manualPagination: true,
    });

    const rowHeight = 45;
    const headerHeight = 42;

    return (
        <div className="opportunity-wrapper p-6">
            <DndProvider backend={HTML5Backend}>
                <TaskActions
                    addType={"Opportunity"}
                    selectedType={"List"}
                    availableColumns={availableColumns}
                    onColumnsChange={handleColumnsChange}
                />
                <div className="opportunity-table-container font-light">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-gray-600">Loading opportunities...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center justify-center py-8 bg-red-50 border border-red-200 rounded">
                            <p className="text-red-600">Error: {error}</p>
                        </div>
                    )}
                    {!loading && !error && (
                        <>
                            <div className="table-wrapper overflow-x-auto">
                                <table className="w-full border text-sm bg-white">
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
                                        {opportunities.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length} className="text-center py-4">
                                                    <i>No opportunities found</i>
                                                </td>
                                            </tr>
                                        ) : (
                                            table.getRowModel().rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="hover:bg-gray-50 even:bg-gray-100"
                                                    style={{ height: `${rowHeight}px` }}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <td
                                                            key={cell.id}
                                                            className="border p-1 align-middle text-left"
                                                        >
                                                            <div className="p-1 h-full flex items-center">
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext()
                                                                )}
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {opportunities.length > 0 && (
                                <div className="flex items-center justify-start gap-4 w-full ml-3 text-[12px] my-4">
                                    <button
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="text-blue-600 disabled:opacity-30"
                                    >
                                        {"<"}
                                    </button>
                                    {(() => {
                                        const totPages = Math.ceil(opportunities.length / pagination.pageSize);
                                        const currPage = pagination.pageIndex;
                                        const visiblePages = 3;
                                        let start = Math.max(0, currPage - Math.floor(visiblePages / 2));
                                        let end = start + visiblePages;
                                        if (end > totPages) {
                                            end = totPages;
                                            start = Math.max(0, end - visiblePages);
                                        }
                                        return [...Array(end - start)].map((_, i) => {
                                            const page = start + i;
                                            const isActive = page === currPage;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => table.setPageIndex(page)}
                                                    className={`px-3 py-1 ${isActive ? "bg-gray-200 font-semibold" : ""
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
                                        className="text-blue-600 disabled:opacity-30"
                                    >
                                        {">"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DndProvider>
        </div>
    );
};

export default Opportunity;