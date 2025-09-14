const { cmd } = require("../command");
const yts = require("yt-search");
const path = require("path");
const { exec } = require("child_process");

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

      // Search YouTube
      const search = await yts(q);
      const data = search.videos[0];
      if (!data) return reply("❌ *No video found*");

      const url = data.url;
      const fileName = `${data.title}.mp3`.replace(/[\\\/:*?"<>|]/g, "");
      const filePath = path.join(__dirname, fileName);

      // Send basic info first
      const desc = `
🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👀 *Views:* ${data.views.toLocaleString()}
🔗 *Watch Here:* ${data.url}
      `;
      await gvbud.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

      // Path to cookies file
      const cookiesPath = path.join(__dirname, "cookies.txt");

      // Download audio using yt-dlp with cookies
      const command = `yt-dlp "${url}" --extract-audio --audio-format mp3 --audio-quality 192K --cookies "${cookiesPath}" --output "${filePath}"`;

      exec(command, async (error) => {
        if (error) {
          console.log(error);
          return reply(`❌ *Error downloading song:* ${error.message}`);
        }

        // Send audio
        await gvbud.sendMessage(
          from,
          { audio: { url: filePath }, mimetype: "audio/mpeg" },
          { quoted: mek }
        );

        // Send document version
        await gvbud.sendMessage(
          from,
          {
            document: { url: filePath },
            mimetype: "audio/mpeg",
            fileName: fileName,
            caption: "🎶 *Your song is ready!*",
          },
          { quoted: mek }
        );

        reply("✅ *Song downloaded successfully!*");
      });
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
