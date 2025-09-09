import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import Button from './ui/Button';

interface UploadZoneProps {
  accept: string;
  maxSize: number;
  multiple?: boolean;
  onUpload: (files: File[]) => Promise<void>;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

export default function UploadZone({
  accept,
  maxSize,
  multiple = false,
  onUpload,
  title,
  description,
  icon: Icon
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.match(accept.replace('*', '.*'));
      const isValidSize = file.size <= maxSize;
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      setUploadStatus('error');
      return;
    }

    setUploadedFiles(validFiles);
    setUploading(true);
    setUploadStatus('idle');

    try {
      await onUpload(validFiles);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <motion.div
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragOver 
            ? 'border-purple-400/70 bg-purple-400/10' 
            : 'border-white/20 hover:border-purple-400/50 hover:bg-white/5'
          }
          ${uploadStatus === 'success' ? 'border-green-400/50 bg-green-400/10' : ''}
          ${uploadStatus === 'error' ? 'border-red-400/50 bg-red-400/10' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id={`upload-${title.toLowerCase().replace(/\s+/g, '-')}`}
        />
        
        <label htmlFor={`upload-${title.toLowerCase().replace(/\s+/g, '-')}`} className="cursor-pointer">
          <div className="flex flex-col items-center">
            {uploadStatus === 'success' ? (
              <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
            ) : (
              <Icon className="w-12 h-12 text-gray-400 mb-4" />
            )}
            
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-300 mb-2">{description}</p>
            <p className="text-sm text-gray-500">
              {accept.toUpperCase()} up to {formatFileSize(maxSize)}
            </p>
            
            {uploading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
              </div>
            )}
          </div>
        </label>
      </motion.div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <div className="flex items-center space-x-3">
                <File className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-white">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}