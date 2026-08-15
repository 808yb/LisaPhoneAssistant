import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

function isPrivateIP(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 (Cloud Metadata)
    if (parts[0] === 0) return true; // 0.0.0.0/8
  }
  // IPv6 Private / Link-Local
  const lowerIp = ip.toLowerCase();
  if (lowerIp.startsWith('fd') || lowerIp.startsWith('fc') || lowerIp.startsWith('fe80') || lowerIp === '::') return true;
  return false;
}

export async function fetchSecure(urlStr: string, options: RequestInit = {}): Promise<Response> {
  const url = new URL(urlStr);
  
  if (url.protocol !== 'https:') {
    throw new Error('SSRF Blocked: Only HTTPS is allowed');
  }

  // Prevent accessing metadata endpoints or localhosts directly by IP or DNS
  try {
    const { address } = await lookup(url.hostname);
    if (isPrivateIP(address)) {
      throw new Error('SSRF Blocked: Resolves to private IP');
    }
  } catch (err: any) {
    throw new Error('SSRF Blocked: DNS resolution failed or invalid host - ' + err.message);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
  
  // Link external signal if provided
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(urlStr, { 
      ...options, 
      signal: controller.signal, 
      redirect: 'manual' // Block redirects to prevent bypassing the IP check
    });

    if (res.status >= 300 && res.status < 400) {
       throw new Error('SSRF Blocked: Redirects are not allowed');
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) { // 5MB Limit
      throw new Error('SSRF Blocked: Response size exceeds limit');
    }

    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}
