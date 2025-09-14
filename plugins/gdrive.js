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

      // Extract file ID from the link
      let fileId;
      const match = q.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        fileId = match[1];
      } else {
        return reply("❌ *Invalid Google Drive link*");
      }

      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Temporary file path
      const tempFilePath = path.join(__dirname, `${fileId}.tmp`);

      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
      });

      // Save file temporarily
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Send file via WhatsApp
      await gvbud.sendMessage(
        from,
        {
          document: fs.createReadStream(tempFilePath),
          mimetype: "application/octet-stream",
          fileName: "GoogleDriveFile",
          caption: "📁 *Here is your downloaded file!*",
        },
        { quoted: mek }
      );

      // Delete temporary file
      fs.unlinkSync(tempFilePath);

      return reply("✅ *Download complete!*");
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
