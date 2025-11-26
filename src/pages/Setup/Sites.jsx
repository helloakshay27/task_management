import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import CustomTable from "@/components/Setup/CustomTable";
import SiteCreateModal from "@/components/Setup/SiteCreateModal";
import Switch from '@mui/joy/Switch';
import { deleteSite, fetchSites, updateSite } from "@/redux/slices/siteSlice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ActionIcons = ({ row, onEdit }) => {
    const token = localStorage.getItem('token');
    const [isActive, setIsActive] = useState(row.original.status);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const dispatch = useDispatch();

    // ✅ Sync isActive with updated row.original.active
    useEffect(() => {
        setIsActive(row.original.status);
    }, [row.original.status]);

    const handleToggle = async () => {
        const updatedValue = !isActive;
        setIsActive(updatedValue);

        try {
            const payload = {
                site: {
                    status: updatedValue ? 1 : 0,
                },
            };

            await dispatch(updateSite({ token, id: row.original.id, payload })).unwrap();
            await dispatch(fetchSites({ token })).unwrap();

            toast.dismiss();
            toast.success(`Status ${updatedValue ? 'activated' : 'deactivated'} successfully`, {
                iconTheme: {
                    primary: updatedValue ? 'green' : 'red',
                    secondary: 'white',
                },
            });
        } catch (error) {
            setIsActive(!updatedValue); // Revert UI on failure
            toast.dismiss();
            toast.error('Failed to update status', {
                iconTheme: {
                    primary: 'red',
                    secondary: 'white',
                },
            });
            console.error('Toggle failed:', error);
        }
    };

    const handleDeleteClick = async (id) => {
        try {
            await dispatch(deleteSite({ token, id })).unwrap();
            await dispatch(fetchSites({ token }));
            toast.dismiss();
            toast.success('Site deleted successfully', {
                iconTheme: {
                    primary: 'red',
                    secondary: 'white',
                },
            });
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to delete Role.', {
                iconTheme: {
                    primary: 'red',
                    secondary: 'white',
                },
            });
            console.error('Failed to delete:', error);
        }
    };

    const handleDelete = () => {
        handleDeleteClick(row.original.id);
        setIsDeleteModalOpen(false);
    };

    return (
        <>
            <div className="action-icons flex justify-between gap-5">
                {/* <Switch
                    color={isActive ? 'success' : 'danger'}
                    checked={isActive}
                    onChange={handleToggle}
                /> */}
                <div>
                    <EditOutlinedIcon
                        sx={{ fontSize: '20px' }}
                        className="cursor-pointer"
                        onClick={() => onEdit(row.original)}
                    />
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        title="Delete"
                    >
                        <DeleteOutlineOutlinedIcon sx={{ fontSize: '20px' }} />
                    </button>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />
        </>
    );
};

const Sites = () => {
    const token = localStorage.getItem('token');
    const dispatch = useDispatch();

    const { fetchSites: sites = [] } = useSelector((state) => state.fetchSites);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [modalMode, setModalMode] = useState('create');

    useEffect(() => {
        dispatch(fetchSites({ token })).unwrap();
    }, [dispatch, token]);

    const formatToDDMMYYYY = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, "0")}/${String(
            date.getMonth() + 1
        ).padStart(2, "0")}/${date.getFullYear()}`;
    };

    const handleSuccess = useCallback(async () => {
        try {
            await dispatch(fetchSites({ token })).unwrap();
            setIsModalOpen(false);
        } catch (error) {
            toast.error('Failed to refresh roles.');
            console.error('Refetch failed after modal success:', error);
        }
    }, [dispatch, token]);

    const handleEdit = useCallback((role) => {
        setSelectedSite(role);
        setModalMode('edit');
        setIsModalOpen(true);
    }, []);

    const [columnOrder, setColumnOrder] = useState(() => {
        const savedOrder = localStorage.getItem('sitesTableColumnOrder');
        return savedOrder
            ? JSON.parse(savedOrder)
            : ['name', 'created_at', 'actions'];
    });

    const handleReorderColumns = useCallback((draggedId, targetId) => {
        setColumnOrder((prevOrder) => {
            const draggedIndex = prevOrder.indexOf(draggedId);
            const targetIndex = prevOrder.indexOf(targetId);
            if (draggedIndex === -1 || targetIndex === -1) return prevOrder;
            const newOrder = [...prevOrder];
            newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, draggedId);
            localStorage.setItem('sitesTableColumnOrder', JSON.stringify(newOrder));
            return newOrder;
        });
    }, []);

    const allColumns = useMemo(() => [
        {
            accessorKey: "name",
            header: "Site Name",
            size: 250,
            cell: ({ getValue }) => getValue(),
        },
        {
            accessorKey: "created_at",
            header: "Created On",
            size: 100,
            cell: ({ getValue }) => {
                const date = getValue();
                return date ? (
                    <div className="flex justify-center">{formatToDDMMYYYY(date)}</div>
                ) : null;
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            size: 60,
            cell: ({ row }) => <ActionIcons row={row} onEdit={handleEdit} />,
            meta: {
                cellClassName: 'actions-cell-content',
            },
        },
    ], []);

    const columns = columnOrder
        .map((columnId) => allColumns.find((col) => col.accessorKey === columnId || col.id === columnId))
        .filter(Boolean);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col gap-2 text-[14px]">
                <CustomTable
                    data={sites}
                    columns={columns}
                    title="Sites"
                    buttonText="Add Site"
                    layout="inline"
                    onAdd={() => setIsModalOpen(true)}
                    columnOrder={columnOrder}
                    onReorderColumns={handleReorderColumns}
                />

                <SiteCreateModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                    site={selectedSite}
                    mode={modalMode}
                />
            </div>
        </DndProvider>
    )
}

export default Sites