const { cmd } = require("../command");
const yts = require("yt-search");
const ytdl = require("ytdl-core");
const youtubedl = require("youtube-dl-exec");
const fs = require("fs");

cmd(
  {
    pattern: "song",
    alias: ["mp3", "song"],
    react: "🎶",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");
      reply("⏳ Fetching your song…");

      // 1️⃣ Search YouTube or use direct link
      let videoUrl;
      let videoDetails;

      if (ytdl.validateURL(q)) {
        videoUrl = q;
      } else {
        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("⚠️ No results found.");
        videoUrl = data.url;
      }

      // Try ytdl-core first
      try {
        const videoInfo = await ytdl.getInfo(videoUrl);
        videoDetails = videoInfo.videoDetails;
      } catch (err) {
        console.warn("ytdl-core failed, using youtube-dl-exec as backup", err);
        reply("⚠️ ytdl-core failed. Trying backup method…");

        const info = await youtubedl(videoUrl, { dumpJson: true });
        videoDetails = {
          title: info.title,
          video_url: info.webpage_url,
          lengthSeconds: info.duration,
          uploadDate: info.upload_date || "Unknown",
          viewCount: info.view_count || 0,
          thumbnails: info.thumbnails || [],
        };
      }

      const durationSeconds = parseInt(videoDetails.lengthSeconds, 10);
      if (durationSeconds > 600) { // Increased duration to 600 seconds
        return reply("⏳ *Sorry, audio files longer than 10 minutes are not supported.*");
      }

      const safeTitle = videoDetails.title.replace(/[<>:"/\\|?*]+/g, "");
      const duration =
        new Date(durationSeconds * 1000).toISOString().substr(11, 8);

      const desc = `
🎬 *Title:* ${videoDetails.title}
⏱️ *Duration:* ${duration}
📅 *Uploaded:* ${videoDetails.uploadDate}
👀 *Views:* ${parseInt(videoDetails.viewCount).toLocaleString()}
🔗 *Watch Here:* ${videoDetails.video_url}
`;

      // 2️⃣ Send the info card
      await gvbud.sendMessage(
        from,
        { image: { url: videoDetails.thumbnails.pop()?.url }, caption: desc },
        { quoted: mek }
      );

      // 3️⃣ Stream audio using ytdl-core with error handling
      let audioBuffer;
      try {
        const audioStream = ytdl(videoDetails.video_url, {
          filter: "audioonly",
          quality: "highestaudio",
        }).on("error", (err) => {
          throw err;
        });

        const chunks = [];
        for await (const chunk of audioStream) chunks.push(chunk);
        audioBuffer = Buffer.concat(chunks);
      } catch (err) {
        console.warn("ytdl-core download failed, using youtube-dl-exec backup", err);

        const tmpFile = `/tmp/${safeTitle}.mp3`;
        await youtubedl(videoDetails.video_url, {
          output: tmpFile,
          extractAudio: true,
          audioFormat: "mp3",
          audioQuality: 0, // best
        });

        audioBuffer = fs.readFileSync(tmpFile);
      }

      // 4️⃣ Send as playable audio
      await gvbud.sendMessage(
        from,
        { audio: audioBuffer, mimetype: "audio/mpeg" },
        { quoted: mek }
      );

      // 5️⃣ Send as downloadable document
      await gvbud.sendMessage(
        from,
        {
          document: audioBuffer,
          mimetype: "audio/mpeg",
          fileName: `${safeTitle}.mp3`,
          caption: "🎶 *Your song is ready to be played!*",
        },
        { quoted: mek }
      );

      reply("✅ Thank you for using GV-Bud");
    } catch (e) {
      console.error("Download error:", e);
      reply(`❌ *Error:* ${e?.message || e}`);
    }
  }
);
