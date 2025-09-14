const { cmd } = require("../command");
const yts = require("yt-search");
const path = require("path");
const ytdlp = require("yt-dlp-exec");

cmd(
  {
    pattern: "song",
    react: "🎶",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");

      const search = await yts(q);
      const data = search.videos[0];
      if (!data) return reply("❌ *No video found*");

      const url = data.url;
      const fileName = `${data.title}.mp3`.replace(/[\\\/:*?"<>|]/g, "");
      const filePath = path.join(__dirname, fileName);

      await gvbud.sendMessage(from, { image: { url: data.thumbnail }, caption: `
🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👀 *Views:* ${data.views.toLocaleString()}
🔗 *Watch Here:* ${data.url}
      `}, { quoted: mek });

      // Download audio using yt-dlp-exec
      await ytdlp(url, {
        extractAudio: true,
        audioFormat: "mp3",
        audioQuality: "192K",
        output: filePath,
        cookies: path.join(__dirname, "cookies.txt") // your login cookies
      });

      await gvbud.sendMessage(
        from,
        { audio: { url: filePath }, mimetype: "audio/mpeg" },
        { quoted: mek }
      );

      await gvbud.sendMessage(
        from,
        {
          document: { url: filePath },
          mimetype: "audio/mpeg",
          fileName,
          caption: "🎶 *Your song is ready!*",
        },
        { quoted: mek }
      );

      reply("✅ *Song downloaded successfully!*");

    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
