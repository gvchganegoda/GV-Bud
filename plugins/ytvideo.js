const { cmd } = require("../command");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

// ✅ Use @distube/ytdl-core instead of ytdl-core
const ytdl = require("@distube/ytdl-core");

cmd(
  {
    pattern: "video",
    react: "🎥",
    desc: "Download YouTube Video using @distube/ytdl-core",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("*Provide a name or YouTube link.* 🎥❤️");

      // 🔎 Search video
      const search = await yts(q);
      if (!search.videos || !search.videos.length)
        return reply("❌ No videos found.");

      const data = search.videos[0];
      const url = data.url;

      // 🎥 Send metadata
      const desc = `🎥 *GV-Bud VIDEO DOWNLOADER* 🎥
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

      // ⚡ Download video using @distube/ytdl-core
      const chunks = [];
      const stream = ytdl(url, { quality: "highestvideo" });

      stream.on("data", chunk => chunks.push(chunk));
      const buffer = await new Promise((resolve, reject) => {
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });

      // 4️⃣ Send video
      await gvbud.sendMessage(
        from,
        { video: buffer, caption: `🎥 *${data.title}*` },
        { quoted: mek }
      );

      reply(`✅ Video sent successfully!`);

    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
