import { useMemo, useState, useCallback } from 'react';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CustomTable from '../CustomTable';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ActionIcons = ({ row }) => (
  <div className="flex gap-3 items-center">
    <EditOutlinedIcon
      sx={{ fontSize: 20, cursor: 'pointer' }}
      onClick={() => alert(`Edit: ${row.original.teamName}`)}
    />
    <DeleteOutlineOutlinedIcon
      sx={{ fontSize: 20, cursor: 'pointer' }}
      onClick={() => alert(`Delete: ${row.original.teamName}`)}
    />
  </div>
);

const ProjectTable = () => {
  const navigate = useNavigate();

  const [projectData] = useState([
    {
      teamName: 'Customer app dev',
      teamLead: 'Mahendra Lungare',
      associatedProjects: '',
      teamMembers: 7,
    },
  ]);

  const [columnOrder, setColumnOrder] = useState(() => {
    const savedOrder = localStorage.getItem('projectTableColumnOrder');
    return savedOrder
      ? JSON.parse(savedOrder)
      : ['teamName', 'teamLead', 'associatedProjects', 'teamMembers', 'actions'];
  });

  const handleReorderColumns = useCallback((draggedId, targetId) => {
    setColumnOrder((prevOrder) => {
      const draggedIndex = prevOrder.indexOf(draggedId);
      const targetIndex = prevOrder.indexOf(targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prevOrder;
      const newOrder = [...prevOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      localStorage.setItem('projectTableColumnOrder', JSON.stringify(newOrder));
      return newOrder;
    });
  }, []);

  const handleRowClick = (rowData) => {
    sessionStorage.setItem('ProjectUser', JSON.stringify(rowData));
    navigate('/setup/project-teams/project-details', { state: rowData });
  };

  const allColumns = useMemo(
    () => [
      {
        accessorKey: 'teamName',
        header: 'Team Name',
        size: 200,
        cell: ({ row, getValue }) => (
          <span onClick={() => handleRowClick(row.original)} className="cursor-pointer ">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'teamLead',
        header: 'Team Lead',
        size: 200,
        cell: ({ row, getValue }) => (
          <span onClick={() => handleRowClick(row.original)} className="cursor-pointer ">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'associatedProjects',
        header: 'Associated Projects',
        size: 250,
        cell: ({ row, getValue }) => (
          <span onClick={() => handleRowClick(row.original)} className="cursor-pointer ">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'teamMembers',
        header: () => (
          <>
            Team Members <em className="text-xs">(TL + Members)</em>
          </>
        ),
        size: 150,
        cell: ({ row, getValue }) => (
          <span onClick={() => handleRowClick(row.original)} className="cursor-pointer ">
            {getValue()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 100,
        cell: ({ row }) => <ActionIcons row={row} />,
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
        data={projectData}
        columns={columns}
        title="Active Users"
        layout="inline"
        buttonText="Add Team"
        showDropdown
        columnOrder={columnOrder}
        onReorderColumns={handleReorderColumns}
      />
    </DndProvider>
  );
};

export default ProjectTable;
