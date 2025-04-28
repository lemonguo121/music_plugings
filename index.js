import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 动态加载 plugins 目录下所有 js 文件
async function loadPlugins() {
    const pluginDir = path.join(__dirname, "plugins");
    const files = await fs.readdir(pluginDir);
    const plugins = [];

    for (const file of files) {
        if (file.endsWith(".js")) {
            const pluginPath = path.join(pluginDir, file);
            const module = await import(pathToFileURL(pluginPath).href);
            plugins.push({ name: file, module });
        }
    }

    return plugins;
}

// 用于将路径转为 URL（动态 import 用）
function pathToFileURL(filePath) {
    return new URL(`file://${filePath}`);
}

(async () => {
    const plugins = await loadPlugins();

    for (const { name, module } of plugins) {
        console.log(`正在使用插件: ${name}`);

        const { searchMusic, getLyric, getTopLists, getTopListDetail, getMediaSource } = module;

        // 测试 searchMusic
        const res = await searchMusic("可乐", 1);
        console.log("搜索结果：", res.data.slice(0, 1));

        if (res.data.length > 0) {
            const firstItem = res.data[0];

            const lyric = await getLyric(firstItem);
            console.log("歌词：", lyric.rawLrc.slice(0, 50));

            const media = await getMediaSource(firstItem);
            console.log("播放链接：", media.url);
        }

        // 排行榜
        const topLists = await getTopLists();
        console.log("排行榜：", topLists.slice(0, 1));

        if (topLists[0]?.data?.length > 0) {
            const topListDetail = await getTopListDetail(topLists[0].data[0]);
            console.log("榜单前3：", topListDetail.musicList.slice(0, 3));
        }
        console.log("====\n");
    }
})();