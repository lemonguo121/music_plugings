const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { PluginLoader } = require('musicfree');

const app = express();
app.use(cors());
app.use(express.json());

// 自动加载 plugins 目录下所有插件
const loader = new PluginLoader();
const pluginDir = path.join(__dirname, 'plugins');

fs.readdirSync(pluginDir).forEach(file => {
  if (file.endsWith('.js')) {
    const pluginPath = path.join(pluginDir, file);
    loader.addPluginFromLocal(pluginPath);
  }
});

loader.load();

loader.ready().then(() => {
  console.log('🎵 所有插件已加载完毕');
  const plugins = loader.getPlugins();

  function getPluginByName(name) {
    return plugins.find(p => p.name === name);
  }

  app.get('/search', async (req, res) => {
    const keyword = req.query.q || '';
    const results = [];

    for (const plugin of plugins) {
      try {
        const r = await plugin.search(keyword);
        results.push({ source: plugin.name, data: r });
      } catch (e) {
        results.push({ source: plugin.name, error: e.message });
      }
    }

    res.json(results);
  });

  app.get('/playurl', async (req, res) => {
    const { id, source } = req.query;
    const plugin = getPluginByName(source);
    if (!plugin) return res.status(404).send('Plugin not found');

    try {
      const url = await plugin.getPlayableUrl(id);
      res.json({ url });
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  app.get('/lyric', async (req, res) => {
    const { id, source } = req.query;
    const plugin = getPluginByName(source);
    if (!plugin) return res.status(404).send('Plugin not found');

    try {
      const lyric = await plugin.getLyric(id);
      res.json(lyric);
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  app.get('/playlist', async (req, res) => {
    const { id, source } = req.query;
    const plugin = getPluginByName(source);
    if (!plugin) return res.status(404).send('Plugin not found');

    try {
      const playlist = await plugin.getPlaylistDetail(id);
      res.json(playlist);
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 MusicFree 后端服务启动成功：http://localhost:${PORT}`);
  });
});