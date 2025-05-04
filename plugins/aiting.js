import axios from "axios";
import * as cheerio from "cheerio";
import he from "he"; // 虽然没有用到，但可以保留

const host = "http://www.2t58.com";
const PLATFORM = "aiting";

/** 提取搜索结果 */
async function parseSearchResults(raw_data, separator) {
    const $ = cheerio.load(raw_data);
    const rawPlayList = $("div.play_list").find("li");
    const list = [];

    for (let i = 0; i < rawPlayList.length; i++) {
        const item = $(rawPlayList[i]).find("a");
        const href = $(item[0]).attr("href");
        const idMatch = href.match(/\/song\/(.*?).html/);
        if (!idMatch) continue;

        const id = idMatch[1];
        const separatedText = $(item[0]).text().split(separator);
        const artist = separatedText[0];
        const title = separatedText[1] || separatedText[2] || "";

        list.push({ id, title, artist, platform: PLATFORM });
    }

    return list;
}

/** 格式化歌曲对象 */
function formatMusicItem(item) {
    return {
        id: item.id,
        artist: item.artist,
        title: item.title,
        album: item.album,
        duration: item.duration,
        artwork: item.artwork,
        platform:PLATFORM
    };
}

/** 搜索音乐 */
export async function searchMusic(query, page = 1) {
    const keyword = encodeURIComponent(query);
    const searchUrl = `${host}/so/${keyword}/${page}.html`;
    const response = await axios.get(searchUrl);
    const $ = cheerio.load(response.data);
    const total = $("div.play_list").find("span").text();
    const songList = await parseSearchResults(response.data, " - ");
    const isEnd = total === "" || isNaN(Number(total)) || Number(total) <= page * 68;

    return {
        isEnd,
        data: songList.map(formatMusicItem)
    };
}

/** 搜索专辑（未实现） */
export async function searchAlbum(query, page = 1) {
    return {
        isEnd: true,
        data: []  // zz123 暂无专辑接口实现
    };
}

/** 搜索歌手 */
export async function searchArtist(query, page = 1) {
    const data = await searchBase(query);
    return {
        isEnd: true,
        data: data
            .filter(item => item.sname?.includes(query))
            .map(formatMusicItem)
    };
}

/** 搜索歌单（暂未提供，返回空） */
export async function searchMusicSheet(query, page = 1) {
    return {
        isEnd: true,
        data: []
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
/** 获取音频播放链接 */
export async function getMediaSource(musicItem, quality = "standard") {
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": `${host}/song/${musicItem.id}.html`
    };

    const response = await axios({
        method: "post",
        url: `${host}/js/play.php`,
        headers,
        data: `id=${musicItem.id}&type=music`
    });

    if (response.data.url) {
        return {
            url: response.data.url,
            quality
        };
    }

    return {
        url: ""
    };
}
/** 获取歌词 */
export async function getLyric(musicItem) {
    const url = `${host}/plug/down.php?ac=music&lk=lrc&id=${musicItem.id}`;
    let res = (await axios.get(url, { timeout: 10000 })).data;

    // 清理网站信息
    res = res.replace(/(www\.44h4\.com|www\.2t58\.com|44h4|2t58|欢迎来访|爱听音乐网)/g, "****");

    return {
        rawLrc: res
    };
}

/** 获取排行榜 */
export async function getTopLists() {
    const html = (await axios.get(`${host}/list/top.html`)).data;
    const $ = cheerio.load(html);
    const rawPlayList = $("div.ilingku_fl").find("li");
    const pageData = $("div.pagedata").text();

    const topListArr = [
        { id: "new", title: "新歌榜", description: `每日同步官方数据。${pageData}` },
        { id: "top", title: "飙升榜", description: `每日同步官方数据。${pageData}` },
    ];

    rawPlayList.each((_, el) => {
        const item = $(el).find("a");
        const hrefMatch = $(item[0]).attr("href").match(/\/list\/(.*?).html/);
        if (!hrefMatch) return;
        const id = hrefMatch[1];
        const title = $(item[0]).text();
        topListArr.push({ id, title, description: `每日同步官方数据：${pageData}` });
    });

    return [
        {
            title: "官方榜单",
            data: topListArr
        }
    ];
}

/** 获取榜单详情 */
export async function getTopListDetail(topListItem) {
    const res = { ...topListItem };
    let page = 1;
    let musicList = [];

    while (true) {
        const url = `${host}/list/${topListItem.id}/${page}.html`;
        const searchRes = (await axios.get(url)).data;
        let songList = await parseSearchResults(searchRes, "_");
        songList = songList.map(item => ({
            id: item.id,
            title: item.title,
            artist: item.artist,
            platform:PLATFORM
        }));

        musicList = musicList.concat(songList);
        page++;

        if (songList.length < 68 || page > 3) break;
    }

    res.musicList = musicList;
    return res;
}
export async function getPluginName(topListItem) {
    return {
       name:"爱听",
       platform:PLATFORM
    };
}