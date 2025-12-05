import CustomTable from '@/components/Setup/CustomTable';
import { baseURL } from '../../../apiDomain';
import axios from 'axios';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Eye } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ActionIcons = ({ row, onView, onEdit }) => {
  return (
    <>
      <div className="action-icons flex justify-center gap-2">
        {/* <Switch
                    color={isActive ? 'success' : 'danger'}
                    checked={isActive}
                    onChange={handleToggle}
                /> */}
        <Eye size={18} className="cursor-pointer" onClick={() => onView(row)} />
        <EditOutlinedIcon sx={{ fontSize: 20, cursor: 'pointer' }} onClick={() => onEdit(row)} />
      </div>
    </>
  );
};

const Roster = () => {
  const [rosters, setRosters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const [columnOrder, setColumnOrder] = useState(() => {
    const savedOrder = localStorage.getItem('rosterTableColumnOrder');
    return savedOrder
      ? JSON.parse(savedOrder)
      : ['name', 'location', 'department', 'shift', 'roaster_type', 'created_on', 'actions'];
  });

  const handleReorderColumns = useCallback((draggedId, targetId) => {
    setColumnOrder((prevOrder) => {
      const draggedIndex = prevOrder.indexOf(draggedId);
      const targetIndex = prevOrder.indexOf(targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prevOrder;
      const newOrder = [...prevOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      localStorage.setItem('rosterTableColumnOrder', JSON.stringify(newOrder));
      return newOrder;
    });
  }, []);

  useEffect(() => {
    const getRosters = async () => {
      try {
        const response = await axios.get(`${baseURL}/user_roasters.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setRosters(response.data);
      } catch (error) {
        console.error('Failed to fetch rosters:', error);
      }
    };

    getRosters();
  }, []);

  const handleViewRoster = (row) => {
    navigate(`/setup/roster/${row.original.id}`, { state: row.original });
  };

  const handleEditRoster = (row) => {
    navigate(`/setup/roster/edit/${row.original.id}`, { state: row.original });
  };

  const allColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Template',
        size: 250,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 250,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'department',
        header: 'Department',
        size: 250,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'shift',
        header: 'Shift',
        size: 250,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'roaster_type',
        header: 'Roster Type',
        size: 250,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'created_on',
        header: 'Created On',
        size: 100,
        cell: ({ getValue }) => getValue(),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 60,
        cell: ({ row }) =>
          row.original ? (
            <ActionIcons row={row} onView={handleViewRoster} onEdit={handleEditRoster} />
          ) : null,
      },
    ],
    []
  );

  const columns = columnOrder
    .map((columnId) =>
      allColumns.find((col) => col.accessorKey === columnId || col.id === columnId)
    )
    .filter(Boolean);

  const filteredRosters = rosters.filter((roster) => {
    return roster.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-2 text-[14px]">
        <CustomTable
          data={filteredRosters}
          columns={columns}
          title="Roster Management"
          buttonText="Add"
          layout="inline"
          onAdd={() => navigate('/setup/roster/add-roster')}
          columnOrder={columnOrder}
          onReorderColumns={handleReorderColumns}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>
    </DndProvider>
  );
};

export default Roster;
