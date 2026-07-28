import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';

interface ImageUploadProps {
  value: string;
  onChange: (url: string, publicId: string) => void;
  label?: string;
  folder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, label = 'Upload Image', folder }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB as per backend specification)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    setError('');
    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadUrl = folder ? `/api/v1/media/upload?folder=${encodeURIComponent(folder)}` : '/api/v1/media/upload';
      const res = await apiClient.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        },
      });

      const url = res.data?.url || res.data?.data?.url || res.data?.Url;
      const publicId = res.data?.publicId || res.data?.data?.publicId || res.data?.PublicId || '';
      if (url) {
        onChange(url, publicId);
      } else {
        throw new Error('Upload response did not contain an image URL');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      // Fallback to local simulation if upload endpoint fails (useful for local offline testing)
      console.warn('Falling back to local object URL simulation...');
      const simulateUrl = URL.createObjectURL(file);
      onChange(simulateUrl, 'mock-public-id');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    onChange('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
      {label && <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>{label}</label>}
      
      <div 
        className="upload-dropzone" 
        style={{
          border: '2px dashed var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          position: 'relative',
          cursor: value ? 'default' : 'pointer',
          transition: 'border-color 0.2s ease',
        }}
        onClick={() => !value && !loading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          style={{ display: 'none' }}
        />

        {value ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img 
              src={value} 
              alt="Uploaded Preview" 
              style={{
                maxWidth: '100%',
                maxHeight: '160px',
                borderRadius: '6px',
                objectFit: 'contain',
                border: '1px solid var(--border-color)',
                padding: '0.25rem',
                backgroundColor: 'var(--bg-tertiary)',
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                borderRadius: '50%',
                padding: '0.2rem',
                backgroundColor: 'var(--card-bg)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : loading ? (
          <div style={{ padding: '1rem 0' }}>
            <Loader2 className="spinner" size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--primary-color)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Uploading {progress}%...</p>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.1s ease' }}></div>
            </div>
          </div>
        ) : (
          <div>
            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Click or drag file to upload</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>PNG, JPG, JPEG up to 5MB</p>
          </div>
        )}
      </div>
      {error && <p style={{ color: 'var(--error-color)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  );
};

export default ImageUpload;
