import { NextApiRequest, NextApiResponse } from 'next';
import httpProxyMiddleware from 'next-http-proxy-middleware';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return httpProxyMiddleware(req, res, {
    target: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    pathRewrite: {
      '^/api/users': '/users',
    },
  });
}