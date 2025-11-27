/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import SelectBox from '../../components/SelectBox';
import MultiSelectBox from '../../components/MultiSelectBox';
import { CheckCircle2, FileText, Upload } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { fetchDepartment } from '@/redux/slices/departmentSlice';
import { fetchShift } from '@/redux/slices/shiftSlice';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { baseURL } from '../../../apiDomain';
import { createInternalUser, fetchInternalUser } from '@/redux/slices/userSlice';
import { fetchCompany } from '@/redux/slices/companySlice';
import { fetchRoles } from '@/redux/slices/roleSlice';

const uploadSections = [
    {
        id: 'onBoardingFile',
        label: 'On Boarding',
        description: 'Upload onboarding documentation'
    },
    {
        id: 'employeeHandbookFile',
        label: 'Employee Handbook',
        description: 'Company policies and guidelines'
    },
    {
        id: 'employeeCompensationFile',
        label: 'Employee Compensation',
        description: 'Salary and benefits information'
    },
    {
        id: 'exitProcessFile',
        label: 'Exit Process',
        description: 'Offboarding procedures'
    },
    {
        id: 'managementFile',
        label: 'Employee Management & Record Keeping',
        description: 'HR records and documentation'
    }
];

const workTypeOptions = [
    { label: 'Select Work Type', value: '' },
    { label: 'Work from Office', value: 'Work from Office' },
    { label: 'Work from Home/Office', value: 'Work from Home/Office' },
];

const EmployeeAddPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = localStorage.getItem('token');

    const [departments, setDepartments] = useState([])
    const [shifts, setShifts] = useState([])
    const [company, setCompany] = useState([])
    const [roles, setRoles] = useState([])
    const [users, setUsers] = useState([])
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        company: '',
        role: '',
        reportTo: '',
        deskExtension: '',
        department: '',
        designation: '',
        shift: '',
        employeeId: '',
        lateComing: false,
        applicable: false,
        workType: '',
        building: [],
        floor: [],
        onBoardingFile: null,
        employeeHandbookFile: null,
        employeeCompensationFile: null,
        exitProcessFile: null,
        managementFile: null
    });

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await dispatch(fetchDepartment({ token })).unwrap();
                setDepartments(response);
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        };

        const fetchShifts = async () => {
            try {
                const response = await dispatch(fetchShift({ token })).unwrap();
                setShifts(response.user_shifts);
            } catch (error) {
                console.error('Error fetching shifts:', error);
            }
        };

        const getCompanies = async () => {
            try {
                const response = await dispatch(fetchCompany({ token })).unwrap();
                setCompany(response);
            } catch (error) {
                console.error('Error fetching companies:', error);
            }
        };

        const getRoles = async () => {
            try {
                const response = await dispatch(fetchRoles({ token })).unwrap();
                setRoles(response);
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        };

        const getUsers = async () => {
            try {
                const response = await dispatch(fetchInternalUser({ token })).unwrap();
                setUsers(response);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        getUsers();
        getRoles();
        getCompanies();
        fetchShifts();
        fetchDepartments();
    }, [])

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                [fieldName]: file
            }));
        }
    };

    const validateForm = () => {
        toast.dismiss()
        if (!formData.firstName) {
            toast.error("First Name is required");
            return false;
        }
        if (!formData.lastName) {
            toast.error("Last Name is required");
            return false;
        }
        if (!formData.email) {
            toast.error("Email is required");
            return false;
        }
        if (!formData.mobile) {
            toast.error("Mobile is required");
            return false;
        }
        if (!formData.company) {
            toast.error("Company is required");
            return false;
        }
        if (!formData.role) {
            toast.error("Role is required");
            return false;
        }
        if (!formData.reportTo) {
            toast.error("Report To is required");
            return false;
        }
        if (!formData.department) {
            toast.error("Department is required");
            return false;
        }
        if (!formData.designation) {
            toast.error("Designation is required");
            return false;
        }
        if (!formData.shift) {
            toast.error("Shift is required");
            return false;
        }
        if (!formData.employeeId) {
            toast.error("Employee ID is required");
            return false;
        }
        if (!formData.workType) {
            toast.error("Work Type is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const payload = {
                user: {
                    firstname: formData.firstName,
                    lastname: formData.lastName,
                    email: formData.email,
                    mobile: formData.mobile,
                    role_id: formData.role,
                    employee_type: "internal",
                    report_to_id: formData.reportTo,
                    company_id: formData.company,
                    lock_user_permissions_attributes: [
                        {
                            account_id: formData.company,
                            user_type: "pms_admin",
                            department_id: formData.department,
                            designation: formData.designation,
                            user_shift_id: formData.shift,
                            employee_id: formData.employeeId,
                            role_id: formData.role,
                            work_type: formData.workType,
                            access_level: "Site",
                            access_to: [],
                            on_boarding_attachments_attributes: [
                                { document: formData.onBoardingFile }
                            ],
                            handbook_attachments_attributes: [
                                { document: formData.employeeHandbookFile }
                            ],
                            compensation_attachments_attributes: [
                                { document: formData.employeeCompensationFile }
                            ],
                            exit_process_attachments_attributes: [
                                { document: formData.exitProcessFile }
                            ],
                            management_record_attachments_attributes: [
                                { document: formData.managementFile }
                            ]
                        }
                    ]
                }
            }

            await dispatch(createInternalUser({ token, payload })).unwrap();

            toast.success("Employee added successfully")
            navigate(-1)
        } catch (error) {
            console.log(error)
            if (Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
                toast.error(error.response.data.errors[0])
            }
        }
    };

    return (
        <div className="min-h-screen p-8">
            <form onSubmit={handleSubmit} className="max-w-6xl">
                {/* BASIC INFORMATION Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 bg-[#C72030] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            1
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">BASIC INFORMATION</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mobile<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="mobile"
                                placeholder="Mobile No."
                                value={formData.mobile}
                                maxLength={10}
                                onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, ""); // remove non-digits
                                    handleInputChange({
                                        target: { name: "mobile", value: cleaned.slice(0, 10) }
                                    });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* FUNCTIONAL DETAILS Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 bg-[#C72030] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            2
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">FUNCTIONAL DETAILS</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={
                                    company?.map((item) => ({
                                        label: item.name,
                                        value: item.id,
                                    }))
                                }
                                value={formData.company}
                                onChange={(val) => handleSelectChange('company', val)}
                                placeholder="Select Company"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={
                                    departments?.map((item) => ({
                                        label: item.name,
                                        value: item.id,
                                    }))
                                }
                                value={formData.department}
                                onChange={(val) => handleSelectChange('department', val)}
                                placeholder="Select Department"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={
                                    roles?.map((item) => ({
                                        label: item.name,
                                        value: item.id,
                                    }))
                                }
                                value={formData.role}
                                onChange={(val) => handleSelectChange('role', val)}
                                placeholder="Select Role"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Designation<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="designation"
                                placeholder="Designation"
                                value={formData.designation}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Shift<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={
                                    shifts.map((item) => ({
                                        label: item.timings,
                                        value: item.id,
                                    }))
                                }
                                value={formData.shift}
                                onChange={(val) => handleSelectChange('shift', val)}
                                placeholder="Select Shift"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reports to<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={
                                    users?.map((item) => ({
                                        label: item.firstname + ' ' + item.lastname,
                                        value: item.id,
                                    }))
                                }
                                value={formData.reportTo}
                                onChange={(val) => handleSelectChange('reportTo', val)}
                                placeholder="Select Reports to"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Employee ID<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="employeeId"
                                placeholder="Employee ID"
                                value={formData.employeeId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Work Type<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={workTypeOptions}
                                value={formData.workType}
                                onChange={(val) => handleSelectChange('workType', val)}
                                placeholder="Select Work Type"
                            />
                        </div>
                    </div>
                </div>

                {/* ATTACHMENTS Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-[#C72030] rounded-full flex items-center justify-center text-white text-xs font-bold">
                            4
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">ATTACHMENTS</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {uploadSections.map((section) => (
                            <div
                                key={section.id}
                                className="group relative border-2 border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 bg-white"
                            >
                                <label className="block text-base font-semibold text-gray-800 mb-1">
                                    {section.label}
                                </label>
                                <p className="text-xs text-gray-500 mb-4">{section.description}</p>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {formData[section.id] ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                <span className="text-sm text-gray-700 truncate font-medium">
                                                    {formData[section.id].name}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                <span className="text-sm text-gray-500 italic">
                                                    No file chosen
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <label className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md cursor-pointer transition-colors duration-200 flex-shrink-0">
                                        <Upload className="w-4 h-4" />
                                        Choose
                                        <input
                                            type="file"
                                            onChange={(e) => handleFileChange(e, section.id)}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {formData[section.id] && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>Size: {(formData[section.id].size / 1024).toFixed(1)} KB</span>
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, [section.id]: null }))}
                                                className="text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center gap-4 mt-8">
                    <button
                        type="submit"
                        className="px-8 py-2 bg-[#C72030] text-white rounded hover:bg-[#a01a25] font-medium"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        className="px-8 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeAddPage;