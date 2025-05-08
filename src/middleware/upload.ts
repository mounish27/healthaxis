import { NextHandler } from 'next-connect';

// Define Express-compatible request and response types
type NextApiRequest = {
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
  [key: string]: unknown;
};

type NextApiResponse = {
  status: (code: number) => NextApiResponse;
  json: (data: Record<string, unknown>) => void;
  [key: string]: unknown;
};

export interface UploadMiddlewareConfig {
  maxSize?: number;
  allowedTypes?: string[];
}

interface UploadError extends Error {
  code?: string;
}

// Extend the NextApiRequest type to include our upload config
interface UploadRequest extends NextApiRequest {
  uploadConfig: {
    maxSize: number;
    allowedTypes: string[];
  };
}

export function uploadMiddleware(config: UploadMiddlewareConfig = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = config;

  return async (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    const contentType = req.headers['content-type'];
    if (typeof contentType !== 'string' || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const contentLengthHeader = req.headers['content-length'];
    const contentLength = parseInt(typeof contentLengthHeader === 'string' ? contentLengthHeader : Array.isArray(contentLengthHeader) ? contentLengthHeader[0] || '0' : '0', 10);
    if (contentLength > maxSize) {
      return res.status(400).json({ 
        error: `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      });
    }

    // Add the config to the request for use in the upload handler
    (req as UploadRequest).uploadConfig = {
      maxSize,
      allowedTypes
    };

    try {
      await next();
    } catch (err) {
      const error = err as UploadError;
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large' });
      }
      return res.status(500).json({ error: 'Error uploading file' });
    }
  };
}