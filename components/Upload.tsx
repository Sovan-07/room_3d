import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router';
import {
  PROGRESS_INCREMENT,
  PROGRESS_INTERVAL_MS,
  REDIRECT_DELAY_MS,
} from 'lib/constants';

type UploadProps = {
  onComplete?: (base64: string) => void;
};

const Upload = ({ onComplete = () => {} }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const { isSignedIn } = useOutletContext<AuthContext>();

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const clearTimers = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const processFile = (incomingFile: File) => {
    clearTimers();

    setFile(incomingFile);
    setProgress(0);

    let base64: string | null = null;
    const reader = new FileReader();

    reader.onload = () => {
      base64 = String(reader.result ?? "");
    };

    reader.readAsDataURL(incomingFile);

    intervalRef.current = window.setInterval(() => {
      setProgress((curr) => {
        const next = Math.min(100, curr + PROGRESS_INCREMENT);
        if (next === 100) {
          clearTimers();
          timeoutRef.current = window.setTimeout(() => {
            onComplete(base64 ?? "");
          }, REDIRECT_DELAY_MS);
        }
        return next;
      });
    }, PROGRESS_INTERVAL_MS);
  };

  const handleFiles = (files: FileList | null) => {
    if (!isSignedIn) return;
    if (!files?.length) return;
    processFile(files[0]);
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!isSignedIn) return;
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isSignedIn) return;
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className='upload'>
      {!file ? (
        <div
          className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type='file'
            className='drop-input'
            accept='.jpg, .jpeg, .png'
            disabled={!isSignedIn}
            onChange={(event) => handleFiles(event.target.files)}
          />
          <div className='drop-content'>
            <div className='drop-icon'>
              <UploadIcon size={20} />
            </div>
            <p>
              {isSignedIn
                ? 'Click to upload or drag and drop'
                : 'Sign in or sign up with puter'}
            </p>
            <p className='help'>Maximum file size 10MB</p>
          </div>
        </div>
      ) : (
        <div className='upload-status'>
          <div className='status-content'>
            <div className='status-icon'>
              {progress === 100 ? (
                <CheckCircle2 className='check' />
              ) : (
                <ImageIcon className='image' />
              )}
            </div>
            <h3>{file.name}</h3>
            <div className='progress'>
              <div className='bar' style={{ width: `${progress}%` }} />
              <p className='status-text'>
                {progress < 100 ? 'Analyzing floor plans...' : 'Redirecting...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload
