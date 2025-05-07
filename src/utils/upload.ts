import { UploadResponse } from '../types/upload';

export async function uploadFile(file: File): Promise<UploadResponse> {
  try {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return { 
        url: '', 
        error: 'Only image files (JPG, PNG, GIF, WebP) and PDF documents are allowed' 
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error uploading file');
    }

    const data = await response.json();
    return { url: data.url };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      url: '', 
      error: error instanceof Error ? error.message : 'Error uploading file' 
    };
  }
} 