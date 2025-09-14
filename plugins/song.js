const { cmd } = require("../command");
const yts = require("yt-search");
const { exec } = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "song",
    react: "🎶",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (
    gvbud,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      reply,
    }
  ) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");

      // Search YouTube
      const search = await yts(q);
      const data = search.videos[0];
      if (!data) return reply("❌ *No results found*");

      const url = data.url;

      let desc = `
Song downloader
🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👀 *Views:* ${data.views.toLocaleString()}
🔗 *Watch Here:* ${data.url}
`;

      // Send video info
      await gvbud.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // Temporary file
      const filePath = path.join(__dirname, `${data.title}.mp3`);

      // Download audio using yt-dlp
      await exec(url, {
        output: filePath,
        extractAudio: true,
        audioFormat: "mp3",
        audioQuality: 0,
      });

      // Send audio
      await gvbud.sendMessage(
        from,
        {
          audio: fs.readFileSync(filePath),
          mimetype: "audio/mpeg",
          fileName: `${data.title}.mp3`,
        },
        { quoted: mek }
      );

      // Delete temp file
      fs.unlinkSync(filePath);

      reply("✅ *Your song has been downloaded!*");

    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message} 😞`);
    }
  }
);
