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
    desc: "Download YouTube audio/video with quality options",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("❌ Please provide a YouTube link or search keyword!");

      // ---------- 1️⃣ Find video ----------
      let video;
      if (/^https?:\/\//.test(q)) {
        // If a YouTube link is given directly
        const id = q.split("v=")[1]?.split("&")[0] || q;
        const { video: vid } = await yts({ videoId: id });
        video = vid;
      } else {
        const search = await yts(q);
        video = search.videos[0];
      }
      if (!video) return reply("❌ No video found!");

      const url = video.url;
      const safeTitle = video.title.replace(/[\/\\?%*:|"<>]/g, "_");

      // ---------- 2️⃣ Show video info and ask for format ----------
      const infoMsg = `
🎬 *Title:* ${video.title}
⏱️ *Duration:* ${video.timestamp}
📅 *Uploaded:* ${video.ago}
👀 *Views:* ${video.views.toLocaleString()}
🔗 *Watch:* ${video.url}

➡️ Reply with a number:
   *1* – MP3 (Audio only)
   *2* – 360p Video
   *3* – 720p Video
   *4* – 1080p Video
`;

      await gvbud.sendMessage(
        from,
        { image: { url: video.thumbnail }, caption: infoMsg },
        { quoted: mek }
      );

      // ---------- 3️⃣ Wait for user response ----------
      const WAIT_TIME_MS = 5 * 60 * 1000; // 5 minutes
      const userResponse = await gvbud.waitForMessage({
        from,
        sender: mek.sender,
        timeout: WAIT_TIME_MS,
      }).catch(() => null);

      if (!userResponse) return reply("⏳ Timeout. Please run the command again.");

      const choice = userResponse.message?.conversation?.trim();
      let format, outputExt, mimetype, ytdlpOptions;

      if (choice === "1") {
        format = "bestaudio";
        outputExt = "mp3";
        mimetype = "audio/mpeg";
        ytdlpOptions = { extractAudio: true, audioFormat: "mp3", audioQuality: "192K" };

        // Optional: get direct MP3 link
        const details = await getDownloadDetails(url, "mp3", "stream");
        console.log("Direct MP3 link from API:", details);

      } else if (choice === "2") {
        format = "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/mp4";
        outputExt = "mp4";
        mimetype = "video/mp4";
        ytdlpOptions = {};
      } else if (choice === "3") {
        format = "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/mp4";
        outputExt = "mp4";
        mimetype = "video/mp4";
        ytdlpOptions = {};
      } else if (choice === "4") {
        format = "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/mp4";
        outputExt = "mp4";
        mimetype = "video/mp4";
        ytdlpOptions = {};
      } else {
        return reply("❌ Invalid choice. Please reply with 1, 2, 3, or 4.");
      }

      // ---------- 4️⃣ Download ----------
      const fileName = `${safeTitle}.${outputExt}`;
      const filePath = path.join(__dirname, fileName);

      reply(`📥 Downloading as *${outputExt.toUpperCase()}* ...`);

      await ytdlp(url, {
        format,
        output: filePath,
        ...ytdlpOptions,
      });

      // ---------- 5️⃣ Send the downloaded file ----------
      await gvbud.sendMessage(
        from,
        { [outputExt === "mp3" ? "audio" : "video"]: { url: `file://${filePath}` }, mimetype },
        { quoted: mek }
      );

      // ---------- 6️⃣ Clean up ----------
      fs.unlink(filePath, () => {});
      reply("✅ Download completed!");
    } catch (error) {
      console.error(error);
      reply(`❌ Error: ${error.message}`);
    }
  }
);
