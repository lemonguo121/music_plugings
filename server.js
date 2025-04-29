import express from 'express';
import fs from 'fs';
import path from 'path';

// 动态加载插件目录中的所有插件
const pluginsPath = path.resolve('./plugins'); // 插件目录
const plugins = {};          // 插件模块 { pluginName: module }
let pluginInfos = [];        // 插件信息 { name, platform }

async function loadPlugins() {
    const files = fs.readdirSync(pluginsPath);
    for (const file of files) {
        if (file.endsWith('.js')) {
            const pluginName = file.replace('.js', '');
            try {
                const pluginModule = await import(path.join(pluginsPath, file));
                plugins[pluginName] = pluginModule;

                if (pluginModule.getPluginName) {
                    const info = await pluginModule.getPluginName();
                    pluginInfos.push({ plugin: pluginName, ...info });
                } else {
                    console.warn(`插件 ${pluginName} 没有实现 getPluginName 方法`);
                }
            } catch (err) {
                console.error(`插件 ${file} 加载失败:`, err);
            }
        }
    }
}

// 先异步加载所有插件
await loadPlugins();

const app = express();
const port = process.env.PORT || 10000;

// CORS 设置
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 搜索音乐
app.get('/search', async (req, res) => {
    const { query,type ='music', page = 1, plugin: pluginName } = req.query;

    if (!query || !pluginName) {
        return res.status(400).json({ error: '必须提供查询参数和插件名' });
    }

    try {
        const plugin = plugins[pluginName];
        if (plugin) {
            const result = await plugin.searchBase(query, page,type);
            res.json(result);
        } else {
            res.status(404).json({ error: `插件 ${pluginName} 未找到` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取歌词
app.get('/lyric', async (req, res) => {
    const { id, plugin: pluginName } = req.query;

    if (!id || !pluginName) {
        return res.status(400).json({ error: '必须提供歌曲 ID 和插件名' });
    }

    try {
        const plugin = plugins[pluginName];
        if (plugin) {
            const musicItem = { id };
            const lyric = await plugin.getLyric(musicItem);
            res.json(lyric);
        } else {
            res.status(404).json({ error: `插件 ${pluginName} 未找到` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取音乐资源
app.get('/getMediaSource', async (req, res) => {
    const { id, plugin: pluginName } = req.query;

    if (!id || !pluginName) {
        return res.status(400).json({ error: '必须提供歌曲 ID 和插件名' });
    }

    try {
        const plugin = plugins[pluginName];
        if (plugin) {
            const musicItem = { id };
            const media = await plugin.getMediaSource(musicItem);
            res.json(media);
        } else {
            res.status(404).json({ error: `插件 ${pluginName} 未找到` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取所有插件名字
app.get('/getPlugins', (req, res) => {
    try {
        res.json(pluginInfos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//获取榜单
app.get('/getTopLists',async(req,res)=>{
    const { id, plugin: pluginName } = req.query;
        if (!id || !pluginName) {
            return res.status(400).json({ error: '必须提供榜单ID 和插件名' });
        }
          try {
                const plugin = plugins[pluginName];
                if (plugin) {
                    const musicItem = { id };
                    const topic = await plugin.getTopLists();
                    res.json(topic);
                } else {
                    res.status(404).json({ error: `插件 ${pluginName} 未找到` });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
})

//获取榜单详情
app.get('/getTopListDetail', async (req, res) => {
    const { id, plugin: pluginName } = req.query;

    if (!id || !pluginName) {
        return res.status(400).json({ error: '必须提供榜单 ID 和插件名' });
    }

    try {
        const plugin = plugins[pluginName];
        if (plugin && plugin.getTopListDetail) {
            const topListItem = { id };
            const detail = await plugin.getTopListDetail(topListItem);
            res.json(detail);
        } else {
            res.status(404).json({ error: `插件 ${pluginName} 未找到，或者没有实现 getTopListDetail` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在运行，端口号: ${port}`);
});