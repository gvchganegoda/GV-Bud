const { cmd } = require("../command");
const yts = require("yt-search");
const ytdlp = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "yt",
    react: "🎬",
    desc: "Download YouTube audio/video. Usage: .yt <link or search> | <format>",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q || !q.includes("|")) {
        return reply(
          "❌ Please provide input in the format:\n.yt <YouTube link or search> | <format>\n\nFormats:\n1 - MP3 Audio\n2 - 360p Video\n3 - 720p Video\n4 - 1080p Video"
        );
      }

      // Split input
      const [input, formatChoice] = q.split("|").map(i => i.trim());

      // ---------- 1️⃣ Find video ----------
      let video;
      if (/^https?:\/\//.test(input)) {
        const id = input.split("v=")[1]?.split("&")[0] || input;
        const { video: vid } = await yts({ videoId: id });
        video = vid;
      } else {
        const search = await yts(input);
        video = search.videos[0];
      }

      if (!video) return reply("❌ No video found!");

      const url = video.url;
      const safeTitle = video.title.replace(/[\/\\?%*:|"<>]/g, "_");

      // ---------- 2️⃣ Determine format ----------
      let format, outputExt, mimetype, ytdlpOptions;

      if (formatChoice === "1") {
        format = "bestaudio";
        outputExt = "mp3";
        mimetype = "audio/mpeg";
        ytdlpOptions = { extractAudio: true, audioFormat: "mp3", audioQuality: "192K" };
      } else if (formatChoice === "2") {
        format = "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/mp4";
        outputExt = "mp4";
        mimetype = "video/mp4";
        ytdlpOptions = {};
      } else if (formatChoice === "3") {
        format = "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/mp4";
        outputExt = "mp4";
        mimetype = "video/mp4";
        ytdlpOptions = {};
      } else if (formatChoice === "4") {
        format = "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/mp4";
        outputExt = "mp4";
        mimetype = "video/mp4";
        ytdlpOptions = {};
      } else {
        return reply("❌ Invalid format. Use 1, 2, 3, or 4.");
      }

      // ---------- 3️⃣ Download ----------
      const fileName = `${safeTitle}.${outputExt}`;
      const filePath = path.join(__dirname, fileName);

      reply(`📥 Downloading *${video.title}* as ${outputExt.toUpperCase()}...`);

      await ytdlp(url, {
        format,
        output: filePath,
        ...ytdlpOptions,
      });

      // ---------- 4️⃣ Send file ----------
      await gvbud.sendMessage(
        from,
        { [outputExt === "mp3" ? "audio" : "video"]: { url: `file://${filePath}` }, mimetype },
        { quoted: mek }
      );

      // ---------- 5️⃣ Clean up ----------
      fs.unlink(filePath, () => {});
      reply("✅ Download completed!");
    } catch (error) {
      console.error(error);
      reply(`❌ Error: ${error.message}`);
    }
  }
);
