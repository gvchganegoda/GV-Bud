const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "gdrive",
    react: "📂",
    desc: "Download file from Google Drive link",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("❌ *Please provide a Google Drive file link*");

      // Extract file ID
      const match = q.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (!match || !match[1]) return reply("❌ *Invalid Google Drive link*");
      const fileId = match[1];

      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

      const tempFilePath = path.join(__dirname, `${fileId}.tmp`);

      // Download file
      const response = await axios({
        method: "GET",
        url,
        responseType: "stream",
        maxRedirects: 5, // in case Google Drive redirects
      });

      if (!response.data) return reply("❌ *Failed to fetch the file*");

      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Check file exists and size
      if (!fs.existsSync(tempFilePath) || fs.statSync(tempFilePath).size === 0) {
        return reply("❌ *Downloaded file is empty or not found*");
      }

      // Send file via WhatsApp
      await gvbud.sendMessage(
        from,
        {
          document: { url: tempFilePath },
          mimetype: "application/octet-stream",
          fileName: "GoogleDriveFile",
        },
        { quoted: mek }
      );

      // Delete temp file
      fs.unlinkSync(tempFilePath);

      return reply("✅ *Download complete!*");
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
