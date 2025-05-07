// testxiaoqiu.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 引入插件
const plugin = require('./plugins/xiaoqiu.js'); // 改为你自己的插件文件路径

async function test() {
  const result = await plugin.search('周杰伦');
  console.log('搜索结果：', result);
}

test();