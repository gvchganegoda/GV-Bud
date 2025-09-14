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
      if (!q) return reply("❌ *Please provide a Google Drive link*");

      const match = q.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (!match || !match[1]) return reply("❌ *Invalid Google Drive link*");

      const fileId = match[1];
      const tempFilePath = path.join(__dirname, `${fileId}.tmp`);

      // First request to get confirm token for large files
      const initialResponse = await axios.get(
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        { responseType: "arraybuffer", maxRedirects: 0, validateStatus: null }
      );

      const html = initialResponse.data.toString("utf8");
      let confirmToken = null;
      const tokenMatch = html.match(/confirm=([0-9A-Za-z_]+)&/);
      if (tokenMatch) confirmToken = tokenMatch[1];

      const downloadUrl = confirmToken
        ? `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`
        : `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Download file stream
      const response = await axios({
        method: "GET",
        url: downloadUrl,
        responseType: "stream",
        maxRedirects: 5,
      });

      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Send file
      await gvbud.sendMessage(
        from,
        {
          document: { url: tempFilePath },
          mimetype: "application/octet-stream",
          fileName: "GoogleDriveFile",
        },
        { quoted: mek }
      );

      fs.unlinkSync(tempFilePath);
      return reply("✅ *Download complete!*");
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
