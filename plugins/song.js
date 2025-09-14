const { cmd } = require("../command");
const yts = require("yt-search");
const ytdl = require("ytdl-core");
const youtubedl = require("yt-dlp-exec"); // make sure to install this: npm install yt-dlp-exec

cmd(
  {
    pattern: "song",
    alias: ["mp3", "music"],
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
      if (ytdl.validateURL(q)) {
        videoUrl = q;
      } else {
        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("⚠️ No results found.");
        videoUrl = data.url;
      }

      // 2️⃣ Try downloading with yt-dlp first
      let audioBuffer;
      try {
        const info = await youtubedl(videoUrl, {
          dumpJson: true,
          format: "bestaudio",
          output: "-",
          // cookies: "./cookies.txt" // optional for protected videos
        });

        // If yt-dlp provides a direct URL, fetch the audio
        if (info.url) {
          const stream = ytdl(info.url, { filter: "audioonly", quality: "highestaudio" });
          const chunks = [];
          for await (const chunk of stream) chunks.push(chunk);
          audioBuffer = Buffer.concat(chunks);
        }
      } catch (err) {
        console.warn("yt-dlp failed, falling back to ytdl-core:", err.message);

        // 3️⃣ Fallback to ytdl-core
        const videoInfo = await ytdl.getInfo(videoUrl);
        const durationSeconds = parseInt(videoInfo.videoDetails.lengthSeconds, 10);
        if (durationSeconds > 600) return reply("⏳ *Audio longer than 10 minutes is not supported.*");

        const stream = ytdl(videoUrl, { filter: "audioonly", quality: "highestaudio" });
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        audioBuffer = Buffer.concat(chunks);

        // Update details for messages
        var details = videoInfo.videoDetails;
      }

      // 4️⃣ Prepare metadata
      const detailsData = details || {
        title: "Unknown Title",
        thumbnails: [{ url: "" }],
        viewCount: 0,
        uploadDate: "Unknown",
        video_url: videoUrl
      };

      const safeTitle = detailsData.title.replace(/[<>:"/\\|?*]+/g, "");
      const desc = `
🎬 *Title:* ${detailsData.title}
⏱️ *Duration:* ${detailsData.lengthSeconds ? new Date(parseInt(detailsData.lengthSeconds, 10)*1000).toISOString().substr(11,8) : "Unknown"}
📅 *Uploaded:* ${detailsData.uploadDate}
👀 *Views:* ${parseInt(detailsData.viewCount || 0).toLocaleString()}
🔗 *Watch Here:* ${detailsData.video_url}
`;

      // 5️⃣ Send info card
      await gvbud.sendMessage(from, {
        image: { url: detailsData.thumbnails.pop().url },
        caption: desc
      }, { quoted: mek });

      // 6️⃣ Send playable audio
      await gvbud.sendMessage(from, { audio: audioBuffer, mimetype: "audio/mpeg" }, { quoted: mek });

      // 7️⃣ Send downloadable document
      await gvbud.sendMessage(from, {
        document: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: `${safeTitle}.mp3`,
        caption: "🎶 *Your song is ready to play!*"
      }, { quoted: mek });

      reply("✅ Thank you for using GV-Bud");
    } catch (e) {
      console.error("Download error:", e);
      reply("❌ Unable to download this song. It may be blocked or removed.");
    }
  }
);
