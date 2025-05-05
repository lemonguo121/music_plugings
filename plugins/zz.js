import axios from "axios";
import * as cheerio from "cheerio";
import he from "he"; // 保留未使用

const host = "https://zz123.com";
const PLATFORM = "种子";
/** 秒数转换工具 */
function timeToSeconds(timeStr) {
    try {
        const parts = timeStr.split(":").map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } catch {
        return 0;
    }
    return 0;
}

/** 格式化歌曲对象 */
function formatMusicItem(item) {
    return {
        id: item.id,
        platform: PLATFORM,
        artist: item.sname,
        title: item.mname,
        album: item.pic,
        duration: timeToSeconds(item.play_time),
        artwork: item.pic
    };
}

/** 发起请求 */
async function fetchHtml(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${host}/ajax/?${query}`, {
        headers: {
            accept: "*/*",
            "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
        }
    });
    return response.data;
}

/** 搜索音乐 */
export async function searchMusic(query, page = 1) {
    const res = await fetchHtml({ act: "search", key: query, lang: "" });
    return {
        isEnd: true,
        data: (res.data || []).map(formatMusicItem)
    };
}

/** 搜索专辑 */
export async function searchAlbum(query, page = 1) {
    const res = await fetchHtml({ act: "search", key: query, lang: "", type: "album" });
    return {
        isEnd: true,
        data: (res.data || []).map(item => ({
            id: item.id,
            platform: PLATFORM,
            title: item.mname,
            artwork: item.pic
        }))
    };
}

/** 搜索艺术家 */
export async function searchArtist(query, page = 1) {
    const res = await fetchHtml({ act: "search", key: query, lang: "", type: "artist" });
    return {
        isEnd: true,
        data: (res.data || []).map(item => ({
            id: item.id,
            platform: PLATFORM,
            artist: item.sname
        }))
    };
}

/** 搜索歌单 */
export async function searchMusicSheet(query, page = 1) {
    const res = await fetchHtml({ act: "search", key: query, lang: "", type: "sheet" });
    return {
        isEnd: true,
        data: (res.data || []).map(item => ({
            id: item.id,
            platform: PLATFORM,
            title: item.mname,
            description: item.desc
        }))
    };
}

/** 多类型搜索分发器 */
export async function searchBase(query, page, type) {
    switch (type) {
        case "music":
            return searchMusic(query, page);
        case "album":
            return searchAlbum(query, page);
        case "artist":
            return searchArtist(query, page);
        case "sheet":
            return searchMusicSheet(query, page);
        default:
            return { isEnd: true, data: [] };
    }
}

/** 获取歌词 */
export async function getLyric(musicItem) {
    const res = await fetchHtml({ act: "songinfo", id: musicItem.id, lang: "" });
    return {
        rawLrc: res.data?.lrc || ""
    };
}

/** 获取播放链接 */
export async function getMediaSource(musicItem) {
    const res = await fetchHtml({ act: "songinfo", id: musicItem.id, lang: "" });
    return {
        url: res.data?.mp3 || ""
    };
}

/** 获取排行榜列表 */
/** 获取排行榜（zz123.com） */
export async function getTopLists() {
    const host = "https://zz123.com";
    const response = await axios.get(host);

    if (response.status !== 200 || typeof response.data !== "string") {
        console.error("获取 zz123 榜单 HTML 失败");
        return [];
    }

    const $ = cheerio.load(response.data);
    const topListArr = [];

    $(".d-none .cate-list a").each((_, el) => {
        const href = $(el).attr("href");
        const match = href.match(/\/list\/(\w+)\.htm/);
        if (!match) return;

        const id = match[1];
        const title = $(el).text().trim();

        topListArr.push({
            id,
            title,
            description: "来自 zz123 的榜单"
        });
    });

    return [
        {
            title: "种子音乐",
            data: topListArr
        }
    ];
}

/** 获取榜单详情 */
export async function getTopListDetail(topListItem) {
    const res = await fetchHtml({ act: "topsong", topid: topListItem.id, lang: "" });
    const data = res.data || [];

    return {
        ...topListItem,
        musicList: data.map(formatMusicItem)
    };
}

/* 获取当前插件名字 */
export async function getPluginName(topListItem) {
    return {
       name: "种子",
       platform: "zz"
    };
}