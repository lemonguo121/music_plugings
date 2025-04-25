import { searchMusic, getLyric, getTopLists, getTopListDetail,getMediaSource } from "./plugins/aiting2bygtp.js";

(async () => {
    const res = await searchMusic("可乐", 1);
    console.log("搜索结果：", res);

    if (res.data.length > 0) {
        const lyric = await getLyric(res.data[0]);
        console.log("歌词：", lyric.rawLrc);
        const media = await getMediaSource(res.data[0]);
        console.log("链接：", media);
    }

//    for (let i = 0; i < res.data.length; i++) {
//         const musicItem = res.data[i];
//         const media = await getMediaSource(musicItem);
//        console.log( media);
//       }
    const topLists = await getTopLists();
    console.log("排行榜：", topLists);

    const topListDetail = await getTopListDetail({ id: "top", title: "飙升榜" });
    console.log("榜单详情：", topListDetail.musicList.slice(0, 3));
})();