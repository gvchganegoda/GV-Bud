const { cmd } = require("../command");
const yts = require("yt-search");
const ytdlp = require("yt-dlp-exec");
const path = require("path");
const fs = require("fs");

cmd(
  {
    pattern: "song",
    react: "🎶",
    desc: "Download YouTube Song",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");

      // Search YouTube
      const search = await yts(q);
      const video = search.videos[0];
      if (!video) return reply("❌ *No video found!*");

      const url = video.url;
      const fileName = video.title.replace(/[\/\\?%*:|"<>]/g, "_") + ".mp3";
      const filePath = path.join(__dirname, fileName);

      // Send video info first
      const desc = `
🎬 *Title:* ${video.title}
⏱️ *Duration:* ${video.timestamp}
📅 *Uploaded:* ${video.ago}
👀 *Views:* ${video.views.toLocaleString()}
🔗 *Watch Here:* ${video.url}
`;
      await gvbud.sendMessage(
        from,
        { image: { url: video.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // Limit duration to 30 mins
      const durationParts = video.timestamp.split(":").map(Number);
      const totalSeconds =
        durationParts.length === 3
          ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
          : durationParts[0] * 60 + durationParts[1];
      if (totalSeconds > 1800) return reply("⏳ *Sorry, audio longer than 30 minutes is not supported.*");

      // Download audio with yt-dlp-exec
      await ytdlp(url, {
        extractAudio: true,
        audioFormat: "mp3",
        audioQuality: "192K",
        output: filePath,
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
        {
          document: { url: `file://${filePath}` },
          mimetype: "audio/mpeg",
          fileName: fileName,
          caption: "🎶 *Your song is ready to be played!*",
        },
        { quoted: mek }
      );

      // Delete local file to save space
      fs.unlink(filePath, () => {});

      reply("✅ Song downloaded successfully!");
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
