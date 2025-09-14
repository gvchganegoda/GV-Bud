const { cmd } = require("../command");
const yts = require("yt-search");
const { exec } = require("child_process");
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

      // Search YouTube
      const search = await yts(q);
      const data = search.videos[0];
      if (!data) return reply("❌ *No results found!*");

      const url = data.url;
      const fileName = data.title.replace(/[\/\\?%*:|"<>]/g, "_") + ".mp3";
      const filePath = path.join(__dirname, fileName);

      // Send video info first
      let desc = `
🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👀 *Views:* ${data.views.toLocaleString()}
🔗 *Watch Here:* ${data.url}
`;
      await gvbud.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

      // Download using yt-dlp with cookies
      const cookiesPath = path.join(__dirname, "cookies.txt");

      // Command
      const command = `yt-dlp "${url}" --extract-audio --audio-format mp3 --audio-quality 96K --cookies "${cookiesPath}" --output "${filePath}"`;

      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.log(error);
          return reply(`❌ *Error downloading:* ${error.message}`);
        }

        await gvbud.sendMessage(
          from,
          {
            audio: { url: `file://${filePath}` },
            mimetype: "audio/mpeg",
          },
          { quoted: mek }
        );

        await gvbud.sendMessage(
          from,
          {
            document: { url: `file://${filePath}` },
            mimetype: "audio/mpeg",
            fileName: fileName,
            caption: "🎶 *Your song is ready!*",
          },
          { quoted: mek }
        );

        reply("✅ Song downloaded successfully!");
      });
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
