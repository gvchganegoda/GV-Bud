const { cmd } = require("../command");
const yts = require("yt-search");
const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "song",
    alias: ["mp3"],
    react: "🎶",
    desc: "Download YouTube Song",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");
      reply("⏳ Fetching your song…");

      let videoUrl;

      // Check if input is a valid YouTube URL
      if (ytdl.validateURL(q)) {
        videoUrl = q;
      } else {
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("⚠️ No results found.");
        videoUrl = video.url;
      }

      const info = await ytdl.getInfo(videoUrl);
      const details = info.videoDetails;
      const durationSeconds = parseInt(details.lengthSeconds, 10);

      // Limit for long videos (adjust if needed)
      if (durationSeconds > 600) {
        return reply("⏳ *Sorry, audio files longer than 10 minutes are not supported.*");
      }

      const safeTitle = details.title.replace(/[<>:"/\\|?*]+/g, "");
      const duration = new Date(durationSeconds * 1000).toISOString().substr(11, 8);

      const desc = `
🎬 *Title:* ${details.title}
⏱️ *Duration:* ${duration}
📅 *Uploaded:* ${details.uploadDate}
👀 *Views:* ${parseInt(details.viewCount).toLocaleString()}
🔗 *Watch Here:* ${details.video_url}
`;

      // Send info card
      await gvbud.sendMessage(
        from,
        { image: { url: details.thumbnails.pop().url }, caption: desc },
        { quoted: mek }
      );

      // Prepare temporary file path
      const tmpFile = path.join(__dirname, `${safeTitle}.mp3`);

      // Download audio using ytdl-core
      const audioStream = ytdl(videoUrl, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25, // 32MB buffer to avoid throttling
      });

      const writeStream = fs.createWriteStream(tmpFile);
      audioStream.pipe(writeStream);

      // Wait for download to finish
      await new Promise((resolve, reject) => {
        audioStream.on("error", (err) => reject(err));
        writeStream.on("finish", () => resolve());
        writeStream.on("error", (err) => reject(err));
      });

      const audioBuffer = fs.readFileSync(tmpFile);

      // Send audio
      await gvbud.sendMessage(
        from,
        { audio: audioBuffer, mimetype: "audio/mpeg" },
        { quoted: mek }
      );

      // Send as document for download
      await gvbud.sendMessage(
        from,
        {
          document: audioBuffer,
          mimetype: "audio/mpeg",
          fileName: `${safeTitle}.mp3`,
          caption: "🎶 *Your song is ready!*",
        },
        { quoted: mek }
      );

      // Clean up temp file
      fs.unlinkSync(tmpFile);

      reply("✅ Thank you for using GV-Bud");
    } catch (e) {
      console.error("Download error:", e);
      reply("❌ Unable to download this song. It may be blocked or removed.");
    }
  }
);
