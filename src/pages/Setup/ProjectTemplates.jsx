import { useDispatch, useSelector } from 'react-redux';
import CustomTable from '../../components/Setup/CustomTable';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { editProject, fetchTemplates } from '../../redux/slices/projectSlice';
import toast from 'react-hot-toast';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';

const ActionIcons = ({ row, onEditClick }) => {
  const token = localStorage.getItem('token');
  const dispatch = useDispatch();
  const [isActive, setIsActive] = useState(!!row.original.active);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteTemplate = () => {
    dispatch(editProject({ token, id: row.original.id, payload: { is_template: false } }));
  };

  return (
    <>
      <div className="action-icons flex justify-between gap-5">
        <div>
          {/* <EditOutlinedIcon
                    sx={{ fontSize: '20px', cursor: 'pointer' }}
                    onClick={() => onEditClick(row.original)} // Pass user data on edit icon click
                /> */}
          <button onClick={() => setIsDeleteModalOpen(true)} title="Delete">
            <DeleteOutlineOutlinedIcon sx={{ fontSize: '20px' }} />
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          deleteTemplate();
          setIsDeleteModalOpen(false);
        }}
      />
    </>
  );
};

const ProjectTemplates = () => {
  const token = localStorage.getItem('token');
  const dispatch = useDispatch();
  const { fetchTemplates: templates } = useSelector((state) => state.fetchTemplates);
  const { success } = useSelector((state) => state.editProject);

  console.log(templates);

  useEffect(() => {
    dispatch(fetchTemplates({ token }));
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.dismiss();
      toast.success('Template deleted successfully');
      dispatch(fetchTemplates({ token }));
    }
  }, [success]);

  const [columnOrder, setColumnOrder] = useState(() => {
    const savedOrder = localStorage.getItem('projectTemplatesTableColumnOrder');
    return savedOrder
      ? JSON.parse(savedOrder)
      : ['title', 'project_owner_name', 'priority', 'project_team.project_team_members', 'actions'];
  });

  const handleReorderColumns = useCallback((draggedId, targetId) => {
    setColumnOrder((prevOrder) => {
      const draggedIndex = prevOrder.indexOf(draggedId);
      const targetIndex = prevOrder.indexOf(targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prevOrder;
      const newOrder = [...prevOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      localStorage.setItem('projectTemplatesTableColumnOrder', JSON.stringify(newOrder));
      return newOrder;
    });
  }, []);

  const allColumns = useMemo(
    () => [
      {
        accessorKey: 'title', // still needed for sorting/search
        header: 'Project Template',
        size: 250,
      },
      {
        accessorKey: 'project_owner_name',
        header: 'Owner Name',
        size: 200,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 200,
        cell: ({ row, getValue }) => {
          const value = getValue();
          const capitalized = value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
          return <span className="pl-2">{capitalized}</span>;
        },
      },
      {
        accessorKey: 'project_team.project_team_members',
        header: 'Project Members',
        size: 200,
        cell: ({ row }) => {
          const members = row.original?.project_team?.project_team_members;
          return <span>{Array.isArray(members) ? members.length + 1 : 0}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 60,
        cell: ({ row }) => <ActionIcons row={row} />,
        meta: {
          cellClassName: 'actions-cell-content',
        },
      },
    ],
    []
  );

  const columns = columnOrder
    .map((columnId) =>
      allColumns.find((col) => col.accessorKey === columnId || col.id === columnId)
    )
    .filter(Boolean);

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomTable
        data={templates?.project_managements || []}
        columns={columns}
        title="Templates"
        layout="inline"
        columnOrder={columnOrder}
        onReorderColumns={handleReorderColumns}
      />
    </DndProvider>
  );
};

export default ProjectTemplates;
