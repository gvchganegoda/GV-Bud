const { cmd } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd(
  { pattern: "song", desc: "Download YouTube songs", category: "download" },
  async (gvbud, mek, m, { from, q, reply }) => {
    if (!q) return reply("❌ Provide a song name or YouTube link");

    const search = await yts(q);
    const data = search.videos[0];
    const song = await ytmp3(data.url, "192");

    await gvbud.sendMessage(from, {
      audio: { url: song.download.url },
      mimetype: "audio/mpeg",
    });
  }
);
