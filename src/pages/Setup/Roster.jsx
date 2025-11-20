import CustomTable from '@/components/Setup/CustomTable';
import { baseURL } from '../../../apiDomain';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Eye } from 'lucide-react';

const ActionIcons = ({ row, onView, onEdit }) => {
    return (
        <>
            <div className="action-icons flex justify-center gap-2">
                {/* <Switch
                    color={isActive ? 'success' : 'danger'}
                    checked={isActive}
                    onChange={handleToggle}
                /> */}
                <Eye size={18} className="cursor-pointer"
                // onClick={() => onView(row)} 
                />
                <EditOutlinedIcon
                    sx={{ fontSize: 20, cursor: 'pointer' }}
                // onClick={() => onEdit(row)}
                />
            </div>
        </>
    );
};

const Roster = () => {
    const [rosters, setRosters] = useState([])
    const navigate = useNavigate();

    useEffect(() => {
        const getRosters = async () => {
            try {
                const response = await axios.get(`${baseURL}/user_roasters.json`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                setRosters(response.data)
            } catch (error) {
                console.error('Failed to fetch rosters:', error);
            }
        }

        getRosters()
    }, [])

    const handleViewRoster = (row) => {
        navigate(`/setup/roster/${row.original.id}/view`, { state: row.original });
    };

    const handleEditRoster = (row) => {
        navigate(`/setup/roster/${row.original.id}/edit`, { state: row.original });
    };

    const columns = useMemo(() => [
        {
            accessorKey: "name",
            header: "Template",
            size: 250,
            cell: ({ getValue }) => getValue(),
        },
        {
            accessorKey: "location",
            header: "Location",
            size: 250,
            cell: ({ getValue }) => getValue(),
        },
        {
            accessorKey: "department",
            header: "Department",
            size: 250,
            cell: ({ getValue }) => getValue(),
        },
        {
            accessorKey: "shift",
            header: "Shift",
            size: 250,
            cell: ({ getValue }) => getValue(),
        },
        {
            accessorKey: "roaster_type",
            header: "Roster Type",
            size: 250,
            cell: ({ getValue }) => getValue(),
        },
        {
            accessorKey: "created_on",
            header: "Created On",
            size: 100,
            cell: ({ getValue }) => getValue(),
        },
        {
            id: 'actions',
            header: 'Actions',
            size: 60,
            cell: ({ row }) => (row.original ? <ActionIcons row={row} onView={handleViewRoster} onEdit={handleEditRoster} /> : null),
        },
    ], []);

    return (
        <div className="flex flex-col gap-2 text-[14px]">
            <CustomTable
                data={rosters}
                columns={columns}
                title="Roster Management"
                buttonText="Add"
                layout="inline"
                onAdd={() => navigate('/setup/roster/add-roster')}
            />
        </div>
    )
}

export default Roster