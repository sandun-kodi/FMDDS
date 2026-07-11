import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, Image as ImageIcon, FileText } from 'lucide-react';
import axios from 'axios';

const AttachmentUploader = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (newFiles) => {
    const fileArray = Array.from(newFiles).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      progress: 0,
      status: 'uploading' // uploading, complete, error
    }));
    
    setFiles(prev => [...prev, ...fileArray]);
    
    // Simulate upload process
    fileArray.forEach(fileObj => {
      uploadFile(fileObj.id, fileObj.file);
    });
  };

  const uploadFile = async (id, file) => {
    const formData = new FormData();
    formData.append('files', file);
    const caseId = 1; // Hardcoded for demo

    try {
      const token = localStorage.getItem('fmdds_token');
      await axios.post(`http://localhost:5200/api/v1/attachments/case/${caseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          updateFileStatus(id, percentCompleted, percentCompleted === 100 ? 'complete' : 'uploading');
        }
      });
      // The onUploadProgress handles the 'complete' state transition
    } catch (err) {
      updateFileStatus(id, 0, 'error');
    }
  };

  const updateFileStatus = (id, progress, status) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, progress, status } : f
    ));
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon size={24} style={{ color: 'var(--primary-500)' }} />;
    if (type === 'application/pdf') return <FileText size={24} style={{ color: '#e11d48' }} />;
    return <FileIcon size={24} style={{ color: 'var(--surface-500)' }} />;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel animate-in" style={{ padding: '2.5rem' }}>
        
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--surface-200)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={24} style={{ color: 'var(--primary-500)' }} />
            <span>Document Attachments</span>
          </h2>
          <p>Upload medical images, scanned reports, and evidence photos (SCR-009 / SCR-005)</p>
        </div>

        {/* Dropzone */}
        <div 
          style={{
            border: `2px dashed ${isDragging ? 'var(--primary-500)' : 'var(--surface-300)'}`,
            borderRadius: '0.5rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: isDragging ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface-50)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '2rem'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            style={{ display: 'none' }} 
            accept="image/*,application/pdf"
          />
          <UploadCloud size={48} style={{ color: isDragging ? 'var(--primary-500)' : 'var(--surface-400)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Drag & Drop files here or <span style={{ color: 'var(--primary-600)' }}>browse</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Supported formats: JPEG, PNG, PDF. Max size 25MB per file.
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Uploaded Files</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {files.map(file => (
                <div key={file.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  backgroundColor: 'white', 
                  border: '1px solid var(--surface-200)', 
                  borderRadius: '0.5rem',
                  gap: '1rem'
                }}>
                  
                  <div style={{ flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-100)', borderRadius: '0.25rem' }}>
                    {getFileIcon(file.type)}
                  </div>
                  
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '500', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{file.size}</span>
                    </div>
                    
                    {file.status === 'uploading' ? (
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-200)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${file.progress}%`, height: '100%', backgroundColor: 'var(--primary-500)', transition: 'width 0.3s ease' }} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.85rem' }}>
                        <CheckCircle size={14} /> Upload Complete
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => removeFile(file.id)}
                    style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'var(--surface-400)' }}
                    title="Remove File"
                  >
                    <X size={18} />
                  </button>
                  
                </div>
              ))}
              
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AttachmentUploader;
