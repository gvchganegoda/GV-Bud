const { cmd } = require("../command");
const yts = require("yt-search");
const ytdl = require("ytdl-core");
const ytdl-getinfo = require("ytdl-getinfo");

cmd(
  {
    pattern: "song",          // main trigger
    alias: ["mp3", "song"],  // <-- aliases
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
      let videoInfo;
      if (ytdl.validateURL(q)) {
        videoInfo = await ytdl.getInfo(q);
      } else {
        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return reply("⚠️ No results found.");
        videoInfo = await ytdl.getInfo(data.url);
      }

      const details = videoInfo.videoDetails;
      const durationSeconds = parseInt(details.lengthSeconds, 10);

      if (durationSeconds > 1800) {
        return reply("⏳ *Sorry, audio files longer than 30 minutes are not supported.*");
      }

      const safeTitle = details.title.replace(/[<>:"/\\|?*]+/g, "");
      const duration =
        new Date(durationSeconds * 1000).toISOString().substr(11, 8);

      const desc = `
🎬 *Title:* ${details.title}
⏱️ *Duration:* ${duration}
📅 *Uploaded:* ${details.uploadDate}
👀 *Views:* ${parseInt(details.viewCount).toLocaleString()}
🔗 *Watch Here:* ${details.video_url}
`;

      // 2️⃣ Send the info card
      await gvbud.sendMessage(
        from,
        { image: { url: details.thumbnails.pop().url }, caption: desc },
        { quoted: mek }
      );

      // 3️⃣ Stream audio and build buffer
      const audioStream = ytdl(details.video_url, {
        filter: "audioonly",
        quality: "highestaudio",
      });

      const chunks = [];
      for await (const chunk of audioStream) chunks.push(chunk);
      const audioBuffer = Buffer.concat(chunks);

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
