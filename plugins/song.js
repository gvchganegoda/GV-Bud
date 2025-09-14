const { cmd } = require("../command");
const yts = require("yt-search");
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
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide a song name or YouTube link");

      const search = await yts(q);
      const data = search.videos[0];
      if (!data) return reply("❌ No results found");

      const url = data.url;

      let desc = `
🎬 Title: ${data.title}
⏱ Duration: ${data.timestamp}
📅 Uploaded: ${data.ago}
👀 Views: ${data.views.toLocaleString()}
🔗 Watch: ${data.url}
`;

      await gvbud.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // Temp file
      const filePath = path.join(__dirname, `${data.title}.mp3`);

      // Download audio
      const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      writeStream.on("finish", async () => {
        await gvbud.sendMessage(
          from,
          {
            audio: fs.readFileSync(filePath),
            mimetype: "audio/mpeg",
            fileName: `${data.title}.mp3`,
          },
          { quoted: mek }
        );
        fs.unlinkSync(filePath); // delete temp file
        reply("✅ Your song is ready!");
      });

      stream.on("error", (err) => {
        console.log(err);
        reply("❌ Error downloading audio");
      });
    } catch (e) {
      console.log(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
