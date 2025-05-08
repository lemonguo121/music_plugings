import axios from "axios";
import cryptojs from "crypto-js";
import he from "he";

const pageSize = 20;

const host = "https://y.qq.com";
const PLATFORM = "小秋";

function formatMusicItem(item) {
  const albumid = item.albumid || item.album?.id;
  const albummid = item.albummid || item.album?.mid;
  const albumname = item.albumname || item.album?.title;

  return {
    id: item.id || item.songid,
    songmid: item.mid || item.songmid,
    title: item.title || item.songname,
    artist: item.singer.map(s => s.name).join(", "),
    artwork: albummid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albummid}.jpg` : undefined,
    album: albumname,
    lrc: item.lyric || undefined,
    albumid: albumid,
    albummid: albummid,
    platform:PLATFORM
  };
}

function formatAlbumItem(item) {
  return {
    id: item.albumID || item.albumid,
    albumMID: item.albumMID || item.album_mid,
    title: item.albumName || item.album_name,
    artwork: item.albumPic || `https://y.gtimg.cn/music/photo_new/T002R800x800M000${item.albumMID || item.album_mid}.jpg`,
    date: item.publicTime || item.pub_time,
    singerID: item.singerID || item.singer_id,
    artist: item.singerName || item.singer_name,
    singerMID: item.singerMID || item.singer_mid,
    description: item.desc
  };
}

function formatArtistItem(item) {
  return {
    name: item.singerName,
    id: item.singerID,
    singerMID: item.singerMID,
    avatar: item.singerPic,
    worksNum: item.songNum
  };
}

const searchTypeMap = {
  0: "song",
  2: "album",
  1: "singer",
  3: "songlist",
  7: "song",
  12: "mv"
};

const headers = {
  referer: "https://y.qq.com",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
  Cookie: "uin="
};

export async function search(query, page, type) {
  const res = (await axios({
    url: "https://u.y.qq.com/cgi-bin/musicu.fcg",
    method: "POST",
    data: {
      req_1: {
        method: "DoSearchForQQMusicDesktop",
        module: "music.search.SearchCgiService",
        param: {
          num_per_page: pageSize,
          page_num: page,
          query: query,
          search_type: type
        }
      }
    },
    headers: headers,
    xsrfCookieName: "XSRF-TOKEN",
    withCredentials: true
  })).data;

  return {
    isEnd: res.req_1.data.meta.sum <= page * pageSize,
    data: res.req_1.data.body[searchTypeMap[type]].list
  };
}

 export  async function searchBase(query, page, type) {
      if (type === "music") return await searchMusic(query, page);
      if (type === "album") return await searchAlbum(query, page);
      if (type === "artist") return await searchArtist(query, page);
      if (type === "sheet") return await searchMusicSheet(query, page);
      if (type === "lyric") return await searchLyric(query, page);
  }

async function searchMusic(query, page) {
  const songs = await search(query, page, 0);
  return {
    isEnd: songs.isEnd,
    data: songs.data.map(formatMusicItem)
  };
}

async function searchAlbum(query, page) {
  const albums = await search(query, page, 2);
  return {
    isEnd: albums.isEnd,
    data: albums.data.map(formatAlbumItem)
  };
}

async function searchArtist(query, page) {
  const artists = await search(query, page, 1);
  return {
    isEnd: artists.isEnd,
    data: artists.data.map(formatArtistItem)
  };
}

async function searchMusicSheet(query, page) {
  const musicSheet = await search(query, page, 3);
  return {
    isEnd: musicSheet.isEnd,
    data: musicSheet.data.map(item => ({
      title: item.dissname,
      createAt: item.createtime,
      description: item.introduction,
      playCount: item.listennum,
      worksNums: item.song_count,
      artwork: item.imgurl,
      id: item.dissid,
      artist: item.creator.name
    }))
  };
}

async function searchLyric(query, page) {
  const songs = await search(query, page, 7);
  return {
    isEnd: songs.isEnd,
    data: songs.data.map(it => ({
      ...formatMusicItem(it),
      rawLrcTxt: it.content
    }))
  };
}

export async function getLyric(musicItem) {
  const result = (await axios({
    url: `http://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${musicItem.songmid}&pcachetime=${new Date().getTime()}&g_tk=5381&loginUin=0&hostUin=0&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`,
    headers: {
      Referer: "https://y.qq.com",
      Cookie: "uin="
    },
    method: "get",
    xsrfCookieName: "XSRF-TOKEN",
    withCredentials: true
  })).data;

  const res = JSON.parse(result.replace(/callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g, ""));
  let translation;
  if (res.trans) translation = he.decode(cryptojs.enc.Base64.parse(res.trans).toString(cryptojs.enc.Utf8));

  return {
    rawLrc: he.decode(cryptojs.enc.Base64.parse(res.lyric).toString(cryptojs.enc.Utf8)),
    translation: translation
  };
}

const qualityLevels = {
    low: "128k",
    standard: "320k",
    high: "flac",
    super: "flac24bit"
};
export async function getMediaSource(musicItem) {
      let url = "";
  const res1 = (await axios.get(`https://lxmusicapi.onrender.com/url/tx/${musicItem.songmid}/${qualityLevels['standard']}`, {
          headers: {
              "X-Request-Key": "share-v2"
          }
      })).data;

      if (!res1.url || res1.msg !== "success") {
               const res2 = (await axios.get(`https://lxmusicapi.onrender.com/url/tx/${musicItem.songmid}/${qualityLevels['standard']}`, {
              headers: {
                  "X-Request-Key": "share-v2"
              }
          })).data;

          if (res2.url && res2.msg === "success") {
              url = res2.url;
          }
      } else {
          url = res1.url;
      }

      return {
          url: url
      };
  }

  export async function getPluginName(topListItem) {
      return {
         name:"小秋",
         platform:PLATFORM
      };
  }

  export const pluginInstance = {
    platform: "小秋音乐",
    author: "SoEasy同学",
    version: "0.0.3",
    searchBase,
    getLyric,
    getMediaSource,
    getPluginName
  };

  export default pluginInstance;
