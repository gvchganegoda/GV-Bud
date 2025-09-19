const { cmd } = require("../command");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

// ✅ Valid download libraries
const ytdl = require("ytdl-core");
const ytStream = require("yt-stream");
const ytdlExec = require("youtube-dl-exec");
const youtubeDl = require("youtube-dl"); // legacy

cmd(
  {
    pattern: "video",
    react: "🎥",
    desc: "Download YouTube Video with multiple downloaders",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("*Provide a name or YouTube link.* 🎥❤️");

      // 🔎 1. Search video
      const search = await yts(q);
      if (!search.videos || !search.videos.length)
        return reply("❌ No videos found.");

      const data = search.videos[0];
      const url = data.url;

      // 🎥 2. Send metadata
      const desc = `🎥 *GV-Bud MULTI VIDEO DOWNLOADER* 🎥
👻 *Title* : ${data.title}
👻 *Duration* : ${data.timestamp}
👻 *Views* : ${data.views}
👻 *Uploaded* : ${data.ago}
👻 *Channel* : ${data.author.name}
👻 *Link* : ${data.url}
`;
      await gvbud.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // 🛠️ 3. Choose downloader by first word in q after link
      // Example usage: .video <link> ytdl | ytstream | ytdl-exec | ytdl-legacy
      const parts = q.split(" ");
      const downloader = (parts[1] || "ytdl").toLowerCase();
      const savePath = path.join(__dirname, "yt-video.mp4");

      let buffer;

      if (downloader === "ytdl") {
        const chunks = [];
        const stream = ytdl(url, { quality: "highestvideo" });
        stream.on("data", c => chunks.push(c));
        buffer = await new Promise((resolve, reject) => {
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      } else if (downloader === "ytstream") {
        const stream = await ytStream.stream(url);
        buffer = await streamToBuffer(stream);

      } else if (downloader === "ytdl-exec") {
        await ytdlExec(url, { output: savePath });
        buffer = fs.readFileSync(savePath);

      } else if (downloader === "ytdl-legacy") {
        await new Promise((resolve, reject) => {
          youtubeDl.exec(url, ['-o', savePath], {}, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        buffer = fs.readFileSync(savePath);

      } else {
        return reply("❌ Unknown downloader. Use: ytdl | ytstream | ytdl-exec | ytdl-legacy");
      }

      // 4️⃣ Send video
      await gvbud.sendMessage(
        from,
        { video: buffer, caption: `🎥 *${data.title}*\n\nDownloaded via *${downloader}*` },
        { quoted: mek }
      );

      reply(`✅ Video sent using ${downloader}!`);

    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);

// helper to convert a stream to a buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
