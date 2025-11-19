import { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../apiDomain';

export const FileUploadModal = ({ isOpen, onClose, acceptedTypes = '*', multiple = true, maxSize = 10, type }) => {
    console.log(type)
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const downloadSampleFormat = async () => {
        try {
            if (type === "Task") {
                const response = await axios.get(`${baseURL}/dummy_task_import_template.xlsx`, {
                    responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'task_import_template.xlsx');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (type === "Issues") {
                const response = await axios.get(`${baseURL}/dummy_issue_import_template.xlsx`, {
                    responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'issue_import_template.xlsx');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.log(error)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const validateFile = (file) => {
        const maxSizeBytes = maxSize * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            alert(`File ${file.name} exceeds maximum size of ${maxSize}MB`);
            return false;
        }
        return true;
    };

    const handleFiles = (files) => {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(validateFile);

        if (multiple) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
        } else {
            setSelectedFiles(validFiles.slice(0, 1));
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        try {
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                selectedFiles.forEach(file => {
                    formData.append('file', file);
                })
                if (type === "Task") {
                    axios.post(`${baseURL}/task_managements/import.json`, formData, {
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        }
                    })
                } else if (type === "Issues") {
                    axios.post(`${baseURL}/issues/import_issues.json`, formData, {
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        }
                    })
                }
                window.location.reload();
            }
        } catch (error) {
            console.log(error)
        }
    };

    const handleClose = () => {
        setSelectedFiles([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Upload Files</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Drop Zone */}
                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        <Upload
                            size={40}
                            className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                        />
                        <p className="text-base font-medium text-gray-700 mb-1">
                            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="text-sm text-gray-500 mb-3">or click to browse</p>
                        <p className="text-xs text-gray-400">
                            {multiple ? 'Multiple files allowed' : 'Single file only'} • Max {maxSize}MB per file
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileInput}
                            accept={acceptedTypes}
                            multiple={multiple}
                            className="hidden"
                        />
                    </div>

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Selected Files ({selectedFiles.length})
                            </h3>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <File size={20} className="text-blue-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="ml-3 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between space-x-3 p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={downloadSampleFormat}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Download Sample Format
                    </button>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedFiles.length === 0}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${selectedFiles.length === 0
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};