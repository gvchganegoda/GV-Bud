const { cmd } = require("../command");
const yts = require("yt-search");
const youtubedl = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "song",
    alias: ["mp3", "song"],
    react: "🎶",
    desc: "Download Song from YouTube (no cookies needed)",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");
      reply("⏳ Fetching your song…");

      // 1️⃣ Get YouTube URL
      let videoUrl;
      if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(q)) {
        videoUrl = q;
      } else {
        const search = await yts(q);
        if (!search.videos.length) return reply("⚠️ No results found.");
        videoUrl = search.videos[0].url;
      }

      // 2️⃣ Get video info without cookies
      const info = await youtubedl(videoUrl, {
        dumpJson: true,
        noCheckCertificate: true,
        noWarnings: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
      });

      if (info.duration > 3600) {
        return reply("⏳ *Sorry, audio longer than 1 hour is not supported.*");
      }

      const safeTitle = info.title.replace(/[<>:"/\\|?*]+/g, "");
      const filePath = path.join(__dirname, `${safeTitle}.mp3`);

      // 3️⃣ Download audio
      await youtubedl(videoUrl, {
        extractAudio: true,
        audioFormat: "mp3",
        output: filePath,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
      });

      // 4️⃣ Send info
      const desc = `
🎬 *Title:* ${info.title}
⏱️ *Duration:* ${new Date(info.duration * 1000)
        .toISOString()
        .substr(11, 8)}
👀 *Views:* ${parseInt(info.view_count).toLocaleString()}
🔗 *Watch Here:* ${videoUrl}
      `;
      await gvbud.sendMessage(
        from,
        { image: { url: info.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // 5️⃣ Send audio
      const audioBuffer = fs.readFileSync(filePath);
      await gvbud.sendMessage(
        from,
        { audio: audioBuffer, mimetype: "audio/mpeg" },
        { quoted: mek }
      );

      // 6️⃣ Send as document
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

      // 7️⃣ Clean up local file
      fs.unlinkSync(filePath);
      reply("✅ Download completed successfully!");
    } catch (e) {
      console.error("Download error:", e);
      reply(
        "❌ *Unable to download this song. It may be blocked or region restricted.*"
      );
    }
  }
);
