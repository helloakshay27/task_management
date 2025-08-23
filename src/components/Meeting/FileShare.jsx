import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, File, Image, Video, FileText, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FileShare = ({ onFileUpload, onClose, sharedFiles = [] }) => {
  const [uploadedFiles, setUploadedFiles] = useState(sharedFiles);
  const [isDragging, setIsDragging] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      handleFilesUpload(acceptedFiles);
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB max file size
  });

  const handleFilesUpload = async (files) => {
    setIsDragging(false);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 50MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      // Create file objects with metadata
      const newFiles = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: JSON.parse(localStorage.getItem('user'))?.firstname || 'Anonymous',
        progress: 0,
        status: 'uploading'
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);

      // Simulate upload progress
      for (const fileObj of newFiles) {
        // Update progress
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          ));
        }, 200);

        // Complete upload after 2 seconds
        setTimeout(() => {
          clearInterval(progressInterval);
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, progress: 100, status: 'completed' }
              : f
          ));
        }, 2000);
      }

      // Call the upload handler
      onFileUpload(validFiles);
      toast.success(`Uploaded ${validFiles.length} file(s) successfully!`);

    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload files. Please try again.');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="w-8 h-8 text-purple-500" />;
    } else if (fileType.includes('pdf') || fileType.includes('document')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDownload = (fileObj) => {
    if (fileObj.file) {
      // Create download link for blob
      const url = URL.createObjectURL(fileObj.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileObj.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('File removed from sharing list');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-800">File Sharing</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Upload Area */}
      <div className="p-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive || isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'
            }
          </p>
          <p className="text-sm text-gray-500">
            Max file size: 50MB • All file types supported
          </p>
        </div>
      </div>

      {/* Shared Files List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h4 className="font-medium text-gray-800 mb-3">
            Shared Files ({uploadedFiles.length})
          </h4>
          
          {uploadedFiles.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <File className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No files shared yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(fileObj.type)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {fileObj.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(fileObj.size)} • 
                      Shared by {fileObj.uploadedBy} • 
                      {formatTimestamp(fileObj.uploadedAt)}
                    </div>
                    
                    {/* Upload Progress */}
                    {fileObj.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${fileObj.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Uploading... {fileObj.progress}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {fileObj.status === 'completed' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(fileObj)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Download file"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(fileObj.id)}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Remove from sharing"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Sharing Tips */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <p>💡 <strong>Tips:</strong></p>
          <p>• Files are shared with all meeting participants</p>
          <p>• Max file size: 50MB per file</p>
          <p>• Files are available during the meeting session</p>
        </div>
      </div>
    </div>
  );
};

export default FileShare;
