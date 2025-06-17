import type { CommonHeaders } from './types';

export const createCommonHeaders = (): CommonHeaders => ({
  'content-type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'cache-control': 'max-age=2592000'
});

export const createProxyHeaders = (contentType: string): Record<string, string> => ({
  'content-type': contentType,
  'Access-Control-Allow-Origin': '*',
  'cache-control': 'max-age=2592000'
});

export const createErrorResponse = (message: string, productType: string): Response => {
  const errorData = {
    status: 'failed',
    message,
    product_type: productType
  };
  return new Response(JSON.stringify(errorData), {
    headers: createCommonHeaders()
  });
};

export const createSuccessResponse = (data: any): Response => {
  return new Response(JSON.stringify(data), {
    headers: createCommonHeaders()
  });
};

export const getImageAsBase64 = async (imageUrl: string): Promise<string> => {
  const imageData = await (await fetch(imageUrl)).arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(imageData);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:image/jpeg;base64," + btoa(binary);
};

export const randomString = (length: number): string => {
  return [...Array(length)].map(() => (~~(Math.random() * 36)).toString(36)).join('');
};

export const xmlSearch = (data: string, searchString: string, start = 0): string => {
  const startTag = `<${searchString}>`;
  const endTag = `</${searchString}>`;
  const startIndex = data.indexOf(startTag, start);
  const endIndex = data.indexOf(endTag, start);
  
  if (startIndex === -1 || endIndex === -1) {
    return '';
  }
  
  return data.substring(startIndex + startTag.length, endIndex);
};

export const isWhiteListAllowed = (request: Request, whiteList: string[]): boolean => {
  if (whiteList.length === 0) {
    return true;
  }
  
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  
  return whiteList.includes(origin);
};

export const parseWhiteList = (whiteListEnv?: string): string[] => {
  if (typeof whiteListEnv === "undefined") {
    return [];
  }
  try {
    return JSON.parse(whiteListEnv);
  } catch {
    return [];
  }
};