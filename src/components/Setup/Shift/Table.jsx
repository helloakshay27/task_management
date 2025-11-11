import React, { useState, useMemo, useEffect } from 'react';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Switch from '@mui/joy/Switch';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchShift,
  updateShift,
  deleteShift,
} from '../../../redux/slices/shiftSlice';
import AddShiftModel from './Modal';
import toast from 'react-hot-toast';
import { DeleteConfirmationModal } from '../../DeleteConfirmationModal';

const defaultData = [
  {
    userName: "Rajkumar",
    organisation: "Panchshil Realty",
    emailId: "rajkumar.sharma@panchshil.com",
    role: "Project IT Head",
    invitationStatus: "Accepted",
  }

];

const ShiftTable = ({ openModal, setOpenModal, editMode, setEditMode }) => {
  const token = localStorage.getItem('token');
  const dispatch = useDispatch();
  const { fetchShift: shifts } = useSelector(state => state.fetchShift);

  const [data, setData] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const fixedRowsPerPage = 13;

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchShift({ token })).unwrap();
      } catch (error) {
        toast.error('Failed to fetch shifts.');
        console.error(error);
      }
    };

    fetchData();
  }, [dispatch, token]);

  useEffect(() => {
    if (shifts?.user_shifts && Array.isArray(shifts.user_shifts)) {
      setData(shifts.user_shifts);
    } else if (Array.isArray(shifts)) {
      setData(shifts);
    }
  }, [shifts]);

  const handleEditClick = (row) => {
    setSelectedData(row.original);
    setEditMode(true);
    setOpenModal(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      await dispatch(deleteShift({ token, id })).unwrap();
      toast.success('Shift deleted successfully', {
        iconTheme: { primary: 'red', secondary: 'white' },
      });
      dispatch(fetchShift({ token }));
    } catch (error) {
      toast.error('Failed to delete Shift.');
      console.error(error);
    }
  };

  const ActionIcons = ({ row }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    return (
      <>
        <div className="action-icons flex justify-between gap-5">
          <EditOutlinedIcon
            sx={{ fontSize: 20, cursor: 'pointer' }}
            onClick={() => handleEditClick(row)}
          />
          <DeleteOutlineOutlinedIcon
            sx={{ fontSize: 20, cursor: 'pointer' }}
            onClick={() => setIsDeleteModalOpen(true)}
          />
        </div>
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            handleDeleteClick(row.original.id)
            setIsDeleteModalOpen(false);
          }}
        />
      </>
    );
  };

  const handleToggle = async (row) => {
    const updatedValue = !row.original.active;
    try {
      await dispatch(updateShift({
        token,
        id: row.original.id,
        payload: { active: updatedValue },
      })).unwrap();

      toast.dismiss();
      toast.success(`Status ${updatedValue ? 'activated' : 'deactivated'} successfully`, {
        iconTheme: {
          primary: updatedValue ? 'green' : 'red',
          secondary: 'white',
        },
      });
      dispatch(fetchShift({ token }));
    } catch (error) {
      toast.error('Failed to update status.');
      console.error(error);
    }
  };

  const onSuccess = () => {
    dispatch(fetchShift({ token }));
    setOpenModal(false);
  };

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: fixedRowsPerPage,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: 'timings',
        header: 'Timing',
        size: 150,
        cell: ({ row, getValue }) => {
          return row.original ? getValue() : null;
        },
      },
      {
        accessorKey: 'total_hour',
        header: 'Total Hour',
        size: 120,
        cell: ({ row, getValue }) => {
          return row.original ? getValue() : null;
        },
      },
      {
        accessorKey: 'check_in_margin',
        header: 'Check-in Margin',
        size: 150,
        cell: ({ row, getValue }) => {
          if (!row.original) return null;
          const value = getValue();
          return <div className="m-2">{value || '-'}</div>;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created On',
        size: 150,
        cell: ({ row, getValue }) => {
          if (!row.original || !getValue()) return null;
          const date = new Date(getValue());
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 60,
        cell: ({ row }) => (row.original ? <ActionIcons row={row} /> : null),
        meta: {
          cellClassName: 'actions-cell-content',
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const pageRows = table.getRowModel().rows;
  const numDataRowsOnPage = pageRows.length;
  const numEmptyRowsToAdd = Math.max(0, fixedRowsPerPage - numDataRowsOnPage);

  const rowHeight = 40;

  const headerHeight = 48;
  const desiredTableHeight = (fixedRowsPerPage * rowHeight) + headerHeight;


  return (
    <>
    <div className="project-table-container text-[14px] ">
      <div
        className="table-wrapper overflow-x-auto"
        style={{ height: `${desiredTableHeight}px` }}
      >
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                    className="bg-[#D5DBDB] px-3 py-3.5 text-center font-[500] border-r-2 border-[#FFFFFF]"
                  >
                    {header.isPlaceholder ? null : (
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y" style={{ height: `${fixedRowsPerPage * rowHeight}px` }}>
            {pageRows.map(row => {
              const isDataRowConsideredEmpty = !row.original || Object.values(row.original).every(v => v === null || v === '');

              return (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 even:bg-[#D5DBDB4D] ${isDataRowConsideredEmpty ? 'pointer-events-none text-transparent' : ''}`}
                  style={{ height: `${rowHeight}px` }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={`${cell.column.columnDef.meta?.cellClassName || ''
                        } whitespace-nowrap px-3 py-2 border-r-2
                        }`}
                    >
                      {!isDataRowConsideredEmpty
                        ? flexRender(cell.column.columnDef.cell, cell.getContext())
                        : null}
                    </td>
                  ))}
                </tr>
              );
            })}
            {Array.from({ length: numEmptyRowsToAdd }).map((_, index) => (
              <tr
                key={`empty-row-${index}`}
                style={{ height: `${rowHeight}px` }}
                className="even:bg-[#D5DBDB4D] pointer-events-none"
              >
                {table.getAllLeafColumns().map(column => (
                  <td
                    key={`empty-cell-${index}-${column.id}`}
                    style={{ width: column.getSize() }}
                    className="whitespace-nowrap px-3 py-2 text-transparent border-r-2"
                  >
                    &nbsp;
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls flex items-center justify-between gap-2 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-1 border rounded disabled:opacity-50"
          >
            {'<<'}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1 border rounded disabled:opacity-50"
          >
            {'<'}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1 border rounded disabled:opacity-50"
          >
            {'>'}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-1 border rounded disabled:opacity-50"
          >
            {'>>'}
          </button>
        </div>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>
      </div>
    </div>

    {openModal && (
      <AddShiftModel
        openModal={openModal}
        setOpenModal={setOpenModal}
        isEditMode={editMode}
        initialData={selectedData}
        onSuccess={onSuccess}
      />
    )}
    </>
  );
};

export default ShiftTable;