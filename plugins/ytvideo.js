const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");

// ✅ Use @distube/ytdl-core for downloading video
const ytdl = require("@distube/ytdl-core");

// ✅ Use @scrappy-scraper/youtube_scraper for searching YouTube
const { YoutubeScraper } = require("@scrappy-scraper/youtube_scraper");

const scraper = new YoutubeScraper();

cmd(
  {
    pattern: "video",
    react: "🎥",
    desc: "Download YouTube Video using @distube/ytdl-core & @scrappy-scraper/youtube_scraper",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("*Provide a name or YouTube link.* 🎥❤️");

      // 🔎 Search video using scrappy-scraper
      const results = await scraper.search(q);
      if (!results || !results.length) return reply("❌ No videos found.");

      const data = results[0]; // first video result
      const url = data.url;

      // 🎥 Send metadata
      const desc = `🎥 *GV-Bud VIDEO DOWNLOADER* 🎥
👻 *Title* : ${data.title}
👻 *Duration* : ${data.duration}
👻 *Views* : ${data.views}
👻 *Uploaded* : ${data.uploaded}
👻 *Channel* : ${data.channelName}
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

      reply("✅ Video sent successfully!");

    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
