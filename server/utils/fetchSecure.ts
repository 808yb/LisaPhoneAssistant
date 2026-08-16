import https from 'https';
import dns from 'dns';
import { URL } from 'url';

function isPrivateIP(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 (Cloud Metadata)
    if (parts[0] === 0) return true; // 0.0.0.0/8
  }
  // IPv6 Private / Link-Local + IPv4-mapped
  const lowerIp = ip.toLowerCase();
  if (lowerIp.startsWith('fd') || lowerIp.startsWith('fc') || lowerIp.startsWith('fe80')) return true;
  if (lowerIp.includes('::ffff:127.0.0.1') || lowerIp.includes('::ffff:169.254')) return true;
  return false;
}

export function fetchSecure(urlStr: string, options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      if (parsedUrl.protocol !== 'https:') {
        return reject(new Error('SSRF Blocked: Only HTTPS is allowed'));
      }

      // Secure Agent that performs DNS resolution and validates the exact IP used for the connection
      const agent = new https.Agent({
        lookup: (hostname, dnsOptions, callback) => {
          dns.lookup(hostname, dnsOptions, (err, address, family) => {
            if (err) return callback(err, address as any, family);
            
            if (Array.isArray(address)) {
              for (const record of address) {
                if (isPrivateIP(record.address)) {
                  return callback(new Error(`SSRF Blocked: Resolves to private IP (${record.address})`), address as any, family);
                }
              }
            } else {
              if (isPrivateIP(address as string)) {
                return callback(new Error(`SSRF Blocked: Resolves to private IP (${address})`), address as any, family);
              }
            }
            
            callback(null, address as any, family);
          });
        }
      });

      const requestOptions: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        agent,
        timeout: 5000 // 5 seconds timeout
      };

      const req = https.request(requestOptions, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
          req.destroy();
          return reject(new Error('SSRF Blocked: Redirects are not allowed'));
        }

        const contentLength = res.headers['content-length'];
        if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
          req.destroy();
          return reject(new Error('SSRF Blocked: Response size exceeds limit'));
        }

        let body = '';
        let size = 0;

        res.on('data', (chunk) => {
          size += chunk.length;
          if (size > 5 * 1024 * 1024) {
            req.destroy();
            return reject(new Error('SSRF Blocked: Response size exceeds limit during stream'));
          }
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
            status: res.statusCode,
            text: async () => body,
            json: async () => JSON.parse(body)
          });
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('SSRF Blocked: Request Timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();

    } catch (err) {
      reject(err);
    }
  });
}
