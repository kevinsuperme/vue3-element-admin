#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkMongoDB() {
  const connectionUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vue3-admin';

  console.log('🔍 MongoDB连接检查工具');
  console.log('=====================================');
  console.log(`连接URI: ${connectionUri}`);
  console.log('=====================================\n');

  try {
    // 使用原生MongoDB驱动测试连接
    console.log('📡 使用MongoDB原生驱动测试连接...');
    const client = new MongoClient(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });

    await client.connect();
    console.log('✅ MongoDB原生驱动连接成功！');

    // 获取服务器信息
    const admin = client.db().admin();
    const serverStatus = await admin.serverStatus();
    const serverInfo = await admin.serverInfo();

    console.log(`📊 服务器版本: ${serverInfo.version}`);
    console.log(`📊 运行时间: ${Math.floor(serverStatus.uptime / 60)} 分钟`);
    console.log(`📊 连接数: ${serverStatus.connections.current}`);

    await client.close();

    // 使用Mongoose测试连接
    console.log('\n🦝 使用Mongoose测试连接...');
    await mongoose.connect(connectionUri);
    console.log('✅ Mongoose连接成功！');

    // 测试数据库操作
    console.log('\n🧪 测试数据库操作...');
    const TestSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', TestSchema);

    const testDoc = new TestModel({ test: 'connection_test' });
    await testDoc.save();
    console.log('✅ 文档创建成功');

    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ 文档删除成功');

    console.log('\n🎉 所有测试通过！数据库连接正常。');
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.log('\n💡 解决建议:');

    if (error.message.includes('ECONNREFUSED')) {
      console.log('1. MongoDB服务未启动');
      console.log('2. 检查MongoDB是否安装');
      console.log('3. 检查端口号是否正确（默认27017）');
      console.log('4. 检查防火墙设置');

      console.log('\n🚀 启动MongoDB:');
      console.log('• Windows: net start MongoDB');
      console.log('• macOS: brew services start mongodb-community');
      console.log('• Linux: sudo systemctl start mongod');
    } else if (error.message.includes('authentication')) {
      console.log('1. 检查用户名和密码');
      console.log('2. 检查数据库权限');
      console.log('3. 检查认证数据库');
    } else if (error.message.includes('timeout')) {
      console.log('1. 检查网络连接');
      console.log('2. 检查服务器地址');
      console.log('3. 检查防火墙设置');
    } else {
      console.log('1. 检查连接字符串格式');
      console.log('2. 检查MongoDB版本兼容性');
      console.log('3. 查看详细错误信息');
    }

    console.log('\n🔗 下载MongoDB: https://www.mongodb.com/try/download/community');
    console.log('📚 安装教程: https://docs.mongodb.com/manual/installation/');

    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkMongoDB();
}
