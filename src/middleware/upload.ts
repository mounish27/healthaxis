import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';

export interface UploadMiddlewareConfig {
  maxSize?: number;
  allowedTypes?: string[];
}

export function uploadMiddleware(config: UploadMiddlewareConfig = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = config;

  return async (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxSize) {
      return res.status(400).json({ 
        error: `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      });
    }

    // Add the config to the request for use in the upload handler
    (req as any).uploadConfig = {
      maxSize,
      allowedTypes
    };

    await next();
  };
} 