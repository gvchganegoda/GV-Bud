const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "movie",
    react: "🎬",
    desc: "Download a movie from a URL",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide a movie URL");

      const url = q.trim();
      const fileName = `Movie_${Date.now()}.mp4`;
      const filePath = path.join(__dirname, fileName);

      reply("⏳ Downloading movie, please wait...");

      // Download movie
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        // Send movie file to WhatsApp
        await gvbud.sendMessage(
          from,
          {
            document: { url: filePath },
            mimetype: "video/mp4",
            fileName: fileName,
            caption: `🎬 Here is your movie!`,
          },
          { quoted: mek }
        );

        // Delete file after sending
        fs.unlinkSync(filePath);
      });

      writer.on("error", (err) => {
        console.log(err);
        reply("❌ Error downloading the movie");
      });
    } catch (e) {
      console.log(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
