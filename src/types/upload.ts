import { Tensor3D } from '@tensorflow/tfjs';

export interface UploadResponse {
  url: string;
  error?: string;
}

export interface ImageAnalysisResult {
  condition: string;
  confidence: number;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  uploadDir: string;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  errorMessages: {
    size: string;
    type: string;
    upload: string;
    processing: string;
  };
}

export interface ImageProcessingResult {
  tensor: Tensor3D;
  url: string;
} 