/* eslint-disable react/prop-types */
import { useState, useMemo, useEffect } from 'react';
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
import { fetchDepartment, updateDepartment, deleteDepartment } from '../../../redux/slices/departmentSlice';
import AddDepartmentModel from './Modal';
import toast from 'react-hot-toast';
import { DeleteConfirmationModal } from '../../DeleteConfirmationModal';

const DepartmentTable = ({ openModal, setOpenModal, editMode, setEditMode }) => {
  const token = localStorage.getItem('token');
  const [selectedData, setSelectedData] = useState(null);
  const [data, setData] = useState([]);

  const dispatch = useDispatch();
  const { fetchDepartment: Department } = useSelector((state) => state.fetchDepartment);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchDepartment({ token })).unwrap();
      } catch (error) {
        toast.error("Failed to fetch departments");
      }
    };
    fetchData();
  }, [dispatch, token]);

  useEffect(() => {
    if (Department && Array.isArray(Department)) {
      setData(Department);
    }
  }, [Department]);

  const handleEditClick = (row) => {
    setSelectedData(row.original);
    setEditMode(true);
    setOpenModal(true);
  };

  const onSuccess = () => {
    dispatch(fetchDepartment({ token }));
    setOpenModal(false);
  };

  const handleDeleteClick = async (id) => {
    try {
      await dispatch(deleteDepartment({ token, id })).unwrap();
      toast.dismiss();
      toast.success('Department deleted successfully', {
        iconTheme: {
          primary: 'red',
          secondary: 'white',
        },
      });
      dispatch(fetchDepartment({ token }));
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete Department.', {
        iconTheme: {
          primary: 'red',
          secondary: 'white',
        },
      });
    }
  };

  const handleToggle = async (row) => {
    const updatedValue = !row.original.active;
    const payload = {
      active: updatedValue,
    };

    try {
      await dispatch(updateDepartment({ token, id: row.original.id, payload })).unwrap();
      toast.dismiss();
      toast.success(`Status ${updatedValue ? 'activated' : 'deactivated'} successfully`, {
        iconTheme: {
          primary: updatedValue ? 'green' : 'red',
          secondary: 'white',
        },
      });
      dispatch(fetchDepartment({ token }));
    } catch (error) {
      console.error('Failed to update toggle:', error);
      toast.error(error?.message || 'Failed to update status', {
        iconTheme: {
          primary: 'red',
          secondary: 'white',
        },
      });
    }
  };

  const ActionIcons = ({ row }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    return (
      <>
        <div className="action-icons flex justify-between gap-5">
          <div>
            <EditOutlinedIcon
              sx={{ fontSize: '20px', cursor: 'pointer' }}
              onClick={() => handleEditClick(row)}
            />
            <button title="Delete" onClick={() => setIsDeleteModalOpen(true)}>
              <DeleteOutlineOutlinedIcon sx={{ fontSize: '20px' }} />
            </button>
          </div>
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
    )
  };

  const fixedRowsPerPage = 13;

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Department',
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span> : null;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        cell: ({ row }) => {
          const isActive = row.original.active;
          return (
            <div className="flex gap-4 pl-2">
              <span>Inactive</span>
              <Switch
                color={`${isActive ? 'success' : 'danger'}`}
                checked={isActive}
                onChange={() => handleToggle(row)}
              />
              <span>Active</span>
            </div>
          );
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
    [Department]
  );

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: fixedRowsPerPage,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageRows = table.getRowModel().rows;
  const numEmptyRowsToAdd = Math.max(0, fixedRowsPerPage - pageRows.length);
  const rowHeight = 40;
  const headerHeight = 48;
  const desiredTableHeight = fixedRowsPerPage * rowHeight + headerHeight;

  return (
    <>
      <div className="project-table-container text-[14px] font-light">
        <div className="table-wrapper overflow-x-auto" style={{ height: `${desiredTableHeight}px` }}>
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                      className="bg-[#D5DBDB] px-3 py-3.5 text-center font-[500] border-r-2"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y" style={{ height: `${fixedRowsPerPage * rowHeight}px` }}>
              {pageRows.map((row) => {
                const isEmpty = !row.original || Object.values(row.original).every((v) => v === null || v === '');
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 even:bg-[#D5DBDB4D] ${isEmpty ? 'pointer-events-none text-transparent' : ''}`}
                    style={{ height: `${rowHeight}px` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`${cell.column.columnDef.meta?.cellClassName || ''} whitespace-nowrap px-3 py-2 border-r-2`}
                      >
                        {!isEmpty ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {Array.from({ length: numEmptyRowsToAdd }).map((_, index) => (
                <tr key={`empty-row-${index}`} style={{ height: `${rowHeight}px` }} className="even:bg-[#D5DBDB4D] pointer-events-none">
                  {table.getAllLeafColumns().map((column) => (
                    <td key={`empty-cell-${index}-${column.id}`} style={{ width: column.getSize() }} className="whitespace-nowrap px-3 py-2 text-transparent">
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="flex items-center justify-start gap-4 mt-4 text-[12px]">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="text-red-600 disabled:opacity-30">
              {'<'}
            </button>
            {(() => {
              const totalPages = table.getPageCount();
              const currentPage = table.getState().pagination.pageIndex;
              const visiblePages = 3;
              let start = Math.max(0, currentPage - Math.floor(visiblePages / 2));
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
                    className={`px-3 py-1 ${isActive ? 'bg-gray-200 font-bold' : ''}`}
                  >
                    {page + 1}
                  </button>
                );
              });
            })()}
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="text-red-600 disabled:opacity-30">
              {'>'}
            </button>
          </div>
        )}
      </div>

      {openModal && (
        <AddDepartmentModel
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

export default DepartmentTable;
