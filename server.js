import express from 'express';
import { searchMusic, getLyric, getTopLists, getTopListDetail } from './plugins/aiting2bygtp.js'; // 根据需要调整路径

const app = express();
const port = process.env.PORT || 10000;

// 如果需要，可以开启 CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 定义路由
app.get('/search', async (req, res) => {
    const query = req.query.query;
    const page = req.query.page || 1;
    if (!query) {
        return res.status(400).json({ error: '必须提供查询参数' });
    }

    try {
        const result = await searchMusic(query, page);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/lyric', async (req, res) => {
    const musicId = req.query.id;
    if (!musicId) {
        return res.status(400).json({ error: '必须提供歌曲 ID' });
    }

    try {
        const musicItem = { id: musicId };
        const lyric = await getLyric(musicItem);
        res.json(lyric);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 其他路由根据需要添加...

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在运行，端口号: ${port}`);
});