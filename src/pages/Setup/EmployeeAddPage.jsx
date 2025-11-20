/* eslint-disable react/prop-types */
import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SelectBox from '../../components/SelectBox';

const EmployeeAddPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        deskExtension: '',
        department: '',
        designation: '',
        shift: '',
        employeeId: '',
        lateComing: false,
        applicable: false,
        workType: '',
        building: '',
        floor: '',
        onBoardingFile: null,
        employeeHandbookFile: null,
    });

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
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                [fieldName]: file
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form data:', formData);
    };

    const departmentOptions = [
        { label: 'Select Department', value: '' },
        { label: 'Engineering', value: 'engineering' },
        { label: 'HR', value: 'hr' },
        { label: 'Sales', value: 'sales' },
    ];

    const shiftOptions = [
        { label: 'Select Shift', value: '' },
        { label: 'Morning', value: 'morning' },
        { label: 'Evening', value: 'evening' },
        { label: 'Night', value: 'night' },
    ];

    const workTypeOptions = [
        { label: 'Select Work Type', value: '' },
        { label: 'Full Time', value: 'full_time' },
        { label: 'Part Time', value: 'part_time' },
        { label: 'Contract', value: 'contract' },
    ];

    const buildingOptions = [
        { label: 'Select Building', value: '' },
        { label: 'Building A', value: 'building_a' },
        { label: 'Building B', value: 'building_b' },
        { label: 'Building C', value: 'building_c' },
    ];

    const floorOptions = [
        { label: 'Select Floor', value: '' },
        { label: 'Ground', value: 'ground' },
        { label: 'First', value: 'first' },
        { label: 'Second', value: 'second' },
    ];

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

                    <div className="grid grid-cols-5 gap-4">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030]"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030]"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mobile<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="mobile"
                                placeholder="Mobile No."
                                value={formData.mobile}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Desk Extension<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="deskExtension"
                                placeholder="Desk Extension"
                                value={formData.deskExtension}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030]"
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

                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={departmentOptions}
                                value={formData.department}
                                onChange={(val) => handleSelectChange('department', val)}
                                placeholder="Select Department"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Shift<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={shiftOptions}
                                value={formData.shift}
                                onChange={(val) => handleSelectChange('shift', val)}
                                placeholder="Select Shift"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#C72030]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="lateComing"
                                name="lateComing"
                                checked={formData.lateComing}
                                onChange={handleInputChange}
                                className="w-4 h-4 border border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="lateComing" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Late Coming
                            </label>
                        </div>
                    </div>
                </div>

                {/* Seat Management Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 bg-[#C72030] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            3
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Seat Management</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Building<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={buildingOptions}
                                value={formData.building}
                                onChange={(val) => handleSelectChange('building', val)}
                                placeholder="Select Building"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Floor<span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={floorOptions}
                                value={formData.floor}
                                onChange={(val) => handleSelectChange('floor', val)}
                                placeholder="Select Floor"
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

                    <div className="grid grid-cols-2 gap-6">
                        {/* On Boarding */}
                        <div className="border border-gray-200 rounded p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                On Boarding
                            </label>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-600">
                                    {formData.onBoardingFile ? formData.onBoardingFile.name : 'No file chosen'}
                                </span>
                                <label className="text-red-600 cursor-pointer text-sm font-medium">
                                    Choose file
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileChange(e, 'onBoardingFile')}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {formData.onBoardingFile && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, onBoardingFile: null }))}
                                    className="text-red-600 hover:bg-red-50 p-2 rounded"
                                    title="Remove file"
                                >
                                    <CloseIcon sx={{ fontSize: '20px' }} />
                                </button>
                            )}
                        </div>

                        {/* Employee Handbook */}
                        <div className="border border-gray-200 rounded p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Employee Handbook
                            </label>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-600">
                                    {formData.employeeHandbookFile ? formData.employeeHandbookFile.name : 'No file chosen'}
                                </span>
                                <label className="text-red-600 cursor-pointer text-sm font-medium">
                                    Choose file
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileChange(e, 'employeeHandbookFile')}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {formData.employeeHandbookFile && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, employeeHandbookFile: null }))}
                                    className="text-red-600 hover:bg-red-50 p-2 rounded"
                                    title="Remove file"
                                >
                                    <CloseIcon sx={{ fontSize: '20px' }} />
                                </button>
                            )}
                        </div>
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