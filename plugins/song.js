const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "song",
    react: "🎶",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");

      const isUrl = q.startsWith("http");
      let url = q;

      if (!isUrl) {
        // Search YouTube if input is a keyword
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ *No results found*");
        url = search.videos[0].url;
      }

      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const duration = info.videoDetails.lengthSeconds;

      if (duration > 1800) return reply("⏳ *Sorry, audio longer than 30 min not supported*");

      const filePath = path.join(__dirname, `${title}.mp3`);
      const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      writeStream.on("finish", async () => {
        await gvbud.sendMessage(
          from,
          {
            audio: fs.readFileSync(filePath),
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
          },
          { quoted: mek }
        );
        fs.unlinkSync(filePath);
      });

      reply(`✅ Downloading *${title}*...`);
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
