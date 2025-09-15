const { cmd } = require("../command");
const yts = require("yt-search");
const { getDownloadDetails } = require("youtube-downloader-cc-api");
const ytdlp = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "yt",
    react: "🎬",
    desc: "Download YouTube video (MP4) or audio (MP3)",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q)
        return reply("❌ Please provide a YouTube link or a search keyword!");

      // --- 1️⃣  Find video ---
      let video;
      if (/^https?:\/\//.test(q)) {
        // if it's already a YouTube link
        const id = q.includes("v=") ? q.split("v=")[1].split("&")[0] : q;
        const search = await yts({ videoId: id });
        video = search;
      } else {
        const search = await yts(q);
        video = search.videos[0];
      }
      if (!video) return reply("❌ No video found!");

      const url = video.url;
      const safeTitle = video.title.replace(/[\/\\?%*:|"<>]/g, "_");

      // --- 2️⃣  Ask user which format ---
      const infoMsg = `
🎬 *Title:* ${video.title}
⏱️ *Duration:* ${video.timestamp}
📅 *Uploaded:* ${video.ago}
👀 *Views:* ${video.views.toLocaleString()}
🔗 *Watch:* ${video.url}

➡️ Reply with a number:
   *1* – MP3 (Audio only)
   *2* – MP4 (Full Video)
`;

      await gvbud.sendMessage(
        from,
        { image: { url: video.thumbnail }, caption: infoMsg },
        { quoted: mek }
      );

      // wait for reply (replace with your bot framework's collector if different)
      const userResponse = await gvbud.waitForMessage({
        from,
        sender: mek.sender,
        timeout: 60 * 1000, // 1 minute
      }).catch(() => null);

      if (!userResponse) return reply("⏳ Timeout. Please run the command again.");

      const choice = userResponse.message?.conversation?.trim();
      let format, outputExt, mimetype, ytdlpOptions;

      if (choice === "1") {
        // Audio (MP3)
        format = "bestaudio";
        outputExt = "mp3";
        mimetype = "audio/mpeg";
        ytdlpOptions = {
          extractAudio: true,
          audioFormat: "mp3",
          audioQuality: "192K",
        };
      } else if (choice === "2") {
        // Video (MP4)
        format = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4";
        outputExt = "mp4";
        mimetype = "video/mp4";
        ytdlpOptions = {};
      } else {
        return reply("❌ Invalid choice. Please reply with 1 or 2.");
      }

      // --- 3️⃣  Download ---
      const fileName = `${safeTitle}.${outputExt}`;
      const filePath = path.join(__dirname, fileName);

      reply(`📥 Downloading as *${outputExt.toUpperCase()}* ...`);

      await ytdlp(url, {
        format,
        output: filePath,
        ...ytdlpOptions,
      });

      // --- 4️⃣  Send file back ---
      await gvbud.sendMessage(
        from,
        { [choice === "1" ? "audio" : "video"]: { url: `file://${filePath}` }, mimetype },
        { quoted: mek }
      );

      // --- 5️⃣  Clean up temp file ---
      fs.unlink(filePath, () => {});
      reply("✅ Download completed!");

    } catch (error) {
      console.error(error);
      reply(`❌ Error: ${error.message}`);
    }
  }
);
