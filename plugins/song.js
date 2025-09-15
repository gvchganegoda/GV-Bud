const { cmd } = require("../command");
const yts = require("yt-search");
const ytdlp = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "yt",
    react: "🎬",
    desc: "Download YouTube Audio or Video",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("❌ Please provide a YouTube link or search keyword!");

      // Search or use provided link
      let video;
      if (/^https?:\/\//.test(q)) {
        const search = await yts({ videoId: q.split("v=")[1] });
        video = search; // if direct link
      } else {
        const search = await yts(q);
        video = search.videos[0];
      }
      if (!video) return reply("❌ No video found!");

      const url = video.url;
      const safeTitle = video.title.replace(/[\/\\?%*:|"<>]/g, "_");
      const infoMsg = `
🎬 *Title:* ${video.title}
⏱️ *Duration:* ${video.timestamp}
📅 *Uploaded:* ${video.ago}
👀 *Views:* ${video.views.toLocaleString()}
🔗 *Watch:* ${video.url}

➡️ Reply with:
   *audio*  – to get MP3
   *360p*   – to get Video 360p
   *720p*   – to get Video 720p
   *1080p*  – to get Video 1080p
`;

      // Send thumbnail and prompt user
      await gvbud.sendMessage(
        from,
        { image: { url: video.thumbnail }, caption: infoMsg },
        { quoted: mek }
      );

      // Wait for the next user message (simple collector)
      const userResponse = await gvbud.waitForMessage({
        from,
        sender: mek.sender,
        timeout: 60 * 1000, // 1 min
      }).catch(() => null);

      if (!userResponse)
        return reply("⏳ Timeout. Please run the command again.");

      const choice = userResponse.message?.conversation?.toLowerCase().trim();

      let format = "";
      let outputExt = "";
      let mimetype = "";

      if (choice === "audio") {
        format = "bestaudio";
        outputExt = "mp3";
        mimetype = "audio/mpeg";
      } else if (["360p", "720p", "1080p"].includes(choice)) {
        const map = { "360p": "360", "720p": "720", "1080p": "1080" };
        format = `bestvideo[height<=${map[choice]}]+bestaudio/best[height<=${map[choice]}]`;
        outputExt = "mp4";
        mimetype = "video/mp4";
      } else {
        return reply("❌ Invalid choice. Please type: audio / 360p / 720p / 1080p");
      }

      const fileName = `${safeTitle}.${outputExt}`;
      const filePath = path.join(__dirname, fileName);

      reply(`📥 Downloading your selection: *${choice}* ...`);

      await ytdlp(url, {
        format,
        output: filePath,
        extractAudio: choice === "audio",
        audioFormat: choice === "audio" ? "mp3" : undefined,
        audioQuality: choice === "audio" ? "192K" : undefined,
      });

      // Send file
      await gvbud.sendMessage(
        from,
        { [choice === "audio" ? "audio" : "video"]: { url: `file://${filePath}` }, mimetype },
        { quoted: mek }
      );

      fs.unlink(filePath, () => {});
      reply("✅ Download completed!");

    } catch (error) {
      console.error(error);
      reply(`❌ Error: ${error.message}`);
    }
  }
);
