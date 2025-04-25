const express = require('express');
const { searchMusic, getLyric, getTopLists, getTopListDetail } = require('./plugins/aiting2bygtp.js'); // 根据你的实际文件路径调整

const app = express();
const port = process.env.PORT || 10000; // 你可以使用 Render 提供的环境变量 PORT

// 允许跨域请求 (如果需要的话)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // 你可以指定具体的域名来限制跨域
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 搜索音乐接口
app.get('/search', async (req, res) => {
    const query = req.query.query;
    const page = req.query.page || 1;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const result = await searchMusic(query, page);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取歌词接口
app.get('/lyric', async (req, res) => {
    const musicId = req.query.id;
    if (!musicId) {
        return res.status(400).json({ error: 'Music ID is required' });
    }

    try {
        const musicItem = { id: musicId }; // 根据实际情况创建 musicItem
        const result = await getLyric(musicItem);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取排行榜接口
app.get('/top-lists', async (req, res) => {
    try {
        const result = await getTopLists();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取排行榜详情接口
app.get('/top-list-detail', async (req, res) => {
    const listId = req.query.id;
    if (!listId) {
        return res.status(400).json({ error: 'List ID is required' });
    }

    try {
        const result = await getTopListDetail({ id: listId });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});