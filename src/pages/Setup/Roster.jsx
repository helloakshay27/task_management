import CustomTable from '@/components/Setup/CustomTable';
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom';

const Roster = () => {
    const navigate = useNavigate();
    const formatToDDMMYYYY = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, "0")}/${String(
            date.getMonth() + 1
        ).padStart(2, "0")}/${date.getFullYear()}`;
    };

    const columns = useMemo(() => [
        {
            accessorKey: "template",
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
            accessorKey: "roster_type",
            header: "Roster Type",
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
    ], []);

    return (
        <div className="flex flex-col gap-2 text-[14px]">
            <CustomTable
                data={[]}
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