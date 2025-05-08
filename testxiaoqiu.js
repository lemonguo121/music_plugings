// testxiaoqiu.js
import { pluginInstance as xiaoqiu } from './test/xiaoqiu1.js';

(async () => {
  const res = await xiaoqiu.searchBase('周杰伦', 1, 'music');
  console.log("搜索结果：", res.data?.slice(0, 1));

  const item = res.data?.[0];
  if (item) {
    const lyric = await xiaoqiu.getLyric(item);
    console.log("歌词预览：", lyric.rawLrc?.slice(0, 50));

    const res = await xiaoqiu.getMediaSource(item);
    console.log("地址", res.url);
  }

  const pluginInfo = await xiaoqiu.getPluginName();
  console.log("插件信息：", pluginInfo);
})();