import { config } from 'dotenv';
import { resolve } from 'path';

// 根据环境加载不同的环境变量文件
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

config({ path: resolve(process.cwd(), envFile) });

// 如果存在本地环境变量文件，也加载它
const localEnvFile = `.env.${env}.local`;
config({ path: resolve(process.cwd(), localEnvFile) });

export default config;
