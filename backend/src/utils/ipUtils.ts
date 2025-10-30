import { Request } from 'express';

interface ExtendedRequest extends Request {
  _remoteAddress?: string;
}

// 获取客户端IP地址
export const getClientIp = (req: ExtendedRequest): string => {
  // 按优先级获取真实IP地址
  const ip = req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.headers['x-client-ip'] ||
           req.headers['cf-connecting-ip'] ||
           req.headers['x-forwarded'] ||
           req.headers['forwarded-for'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           req._remoteAddress ||

           (req.connection && (req.connection as any).socket ? (req.connection as any).socket.remoteAddress : null);

  // 处理x-forwarded-for格式（可能包含多个IP，取第一个）
  if (typeof ip === 'string' && ip.includes(',')) {
    return ip.split(',')[0].trim();
  }

  return ip || 'unknown';
};

// 检查IP是否在列表中（支持CIDR表示法）
export const isIpInList = (ip: string, ipList: string): boolean => {
  if (!ipList || !ip) return false;

  const ips = ipList.split(',').map(ip => ip.trim());

  return ips.some(listIp => {
    // 如果是CIDR表示法
    if (listIp.includes('/')) {
      return isIpInCidr(ip, listIp);
    }

    // 如果是通配符
    if (listIp.includes('*')) {
      return isIpMatchPattern(ip, listIp);
    }

    // 精确匹配
    return ip === listIp;
  });
};

// 检查IP是否在CIDR范围内
const isIpInCidr = (ip: string, cidr: string): boolean => {
  const [range, bits] = cidr.split('/');
  const mask = parseInt(bits, 10);

  if (mask < 0 || mask > 32) return false;

  const ipInt = ipToInt(ip);
  const rangeInt = ipToInt(range);
  const maskInt = (0xffffffff << (32 - mask)) >>> 0;

  return (ipInt & maskInt) === (rangeInt & maskInt);
};

// 检查IP是否匹配通配符模式
const isIpMatchPattern = (ip: string, pattern: string): boolean => {
  const ipParts = ip.split('.');
  const patternParts = pattern.split('.');

  if (ipParts.length !== 4 || patternParts.length !== 4) return false;

  return ipParts.every((part, index) => {
    if (patternParts[index] === '*') return true;
    return part === patternParts[index];
  });
};

// IP地址转整数
const ipToInt = (ip: string): number => {
  const parts = ip.split('.');
  if (parts.length !== 4) return 0;

  return parts.reduce((acc, part, index) => {
    return acc + (parseInt(part, 10) << (8 * (3 - index)));
  }, 0) >>> 0;
};

// 整数转IP地址
export const intToIp = (int: number): string => {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8) & 0xff,
    int & 0xff
  ].join('.');
};

export default {
  getClientIp,
  isIpInList,
  intToIp
};
