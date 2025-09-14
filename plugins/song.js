const { cmd, commands } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd(
  {
    pattern: "song",
    react: "🎶",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");

      reply("⏳ Fetching your song…");

      const search = await yts(q);
      const data = search.videos[0];
      if (!data) return reply("⚠️ No results found.");

      const desc = `
🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👀 *Views:* ${data.views.toLocaleString()}
🔗 *Watch Here:* ${data.url}
`;

      await gvbud.sendMessage(from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      const songData = await ytmp3(data.url, "192");
      const audioUrl = songData?.download?.url || songData?.url;
      if (!audioUrl) return reply("⚠️ Could not fetch the download link.");

      const parts = data.timestamp.split(":").map(Number);
      let totalSeconds = 0;
      if (parts.length === 3) totalSeconds = parts[0]*3600 + parts[1]*60 + parts[2];
      else if (parts.length === 2) totalSeconds = parts[0]*60 + parts[1];

      if (totalSeconds > 1800) {
        return reply("⏳ *Sorry, audio files longer than 30 minutes are not supported.*");
      }

      const safeTitle = data.title.replace(/[<>:"/\\|?*]+/g, '');

      await gvbud.sendMessage(from,
        { audio: { url: audioUrl }, mimetype: "audio/mpeg" },
        { quoted: mek }
      );

      await gvbud.sendMessage(from,
        {
          document: { url: audioUrl },
          mimetype: "audio/mpeg",
          fileName: `${safeTitle}.mp3`,
          caption: "🎶 *Your song is ready to be played!*",
        },
        { quoted: mek }
      );

      reply("✅ Thank you for using GV-Bud");
    } catch (e) {
      console.error("Download error:", e);
      reply(`❌ *Error:* ${e?.message || e}`);
    }
  }
);
