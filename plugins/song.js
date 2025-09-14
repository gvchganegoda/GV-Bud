const { cmd } = require("../command");
const yts = require("yt-search");
const ytdlp = require("yt-dlp-exec");
const path = require("path");

cmd(
  {
    pattern: "song",
    react: "🎶",
    desc: "Download Song using YouTube cookies",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, body, reply, q }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");

      const search = await yts(q);
      const data = search.videos[0];
      if (!data) return reply("❌ *No results found!*");

      const url = data.url;
      const fileName = data.title.replace(/[\/\\?%*:|"<>]/g, "_") + ".mp3";
      const filePath = path.join(__dirname, fileName);
      const cookiesPath = path.join(__dirname, "cookies.txt");

      // Send video info first
      let desc = `
🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👀 *Views:* ${data.views.toLocaleString()}
🔗 *Watch Here:* ${data.url}
`;
      await gvbud.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

      // Download with yt-dlp-exec
      await ytdlp(url, {
        extractAudio: true,
        audioFormat: "mp3",
        audioQuality: "192K",
        output: filePath,
        cookies: cookiesPath,
      });

      // Send audio
      await gvbud.sendMessage(
        from,
        { audio: { url: `file://${filePath}` }, mimetype: "audio/mpeg" },
        { quoted: mek }
      );

      // Send as document
      await gvbud.sendMessage(
        from,
        { document: { url: `file://${filePath}` }, mimetype: "audio/mpeg", fileName: fileName, caption: "🎶 *Your song is ready!*" },
        { quoted: mek }
      );

      reply("✅ Song downloaded successfully!");
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
