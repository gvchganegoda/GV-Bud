const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

async function fetchMovieDetails(id) {
  const url = `https://cinesubz.lk/movies/${id}`;
  const res = await axios.get(url).catch(() => null);
  if (!res) throw new Error("Movie not found");

  const $ = cheerio.load(res.data);

  const title = $("h1").first().text().trim();
  const release = $(".movie-info .release-date").text().trim() || "Unknown";
  const duration = $(".movie-info .duration").text().trim() || "Unknown";

  const downloadLinks = [];

  $(".download-links li").each((i, el) => {
    const quality = $(el).find("strong").text().trim() || "Unknown Quality";
    const link = $(el).find("a").attr("href");
    if (link) downloadLinks.push({ quality, link });
  });

  return { title, release, duration, downloadLinks };
}

async function sendDocument(gvbud, from, link, title) {
  try {
    // Download file to temporary path
    const tempPath = path.join(__dirname, "tempfile.tmp");
    const writer = fs.createWriteStream(tempPath);

    const response = await axios({
      url: link,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Send as document
    await gvbud.sendMessage(from, {
      document: fs.readFileSync(tempPath),
      fileName: `${title}.mp4`, // change extension if needed
      mimetype: "video/mp4",
    });

    // Delete temp file
    fs.unlinkSync(tempPath);
  } catch (err) {
    console.error("Document send error:", err);
    gvbud.sendMessage(from, {
      text: `❌ Failed to send document. Here is the download link:\n${link}`,
    });
  }
}

cmd(
  {
    pattern: "cinesubz",
    react: "🎬",
    desc: "Fetch movie details and download links from cinesubz.lk",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("❌ Provide movie ID, e.g., `flask-2025`");

      const id = q.toLowerCase();
      const details = await fetchMovieDetails(id);

      if (!details.downloadLinks.length) return reply("❌ No download links found.");

      // Send movie info
      let msg = `🎬 *${details.title}*\n🗓 Release: ${details.release}\n⏱ Duration: ${details.duration}\n\n📥 Download Links:\n`;
      details.downloadLinks.forEach((d) => {
        msg += `• ${d.quality}: ${d.link}\n`;
      });

      await reply(msg);

      // Send first available document
      const firstLink = details.downloadLinks[0].link;
      if (firstLink) {
        await sendDocument(gvbud, from, firstLink, details.title);
      }
    } catch (err) {
      console.error("Cinesubz plugin error:", err);
      reply(`❌ Error fetching movie: ${err.message}`);
    }
  }
);

module.exports = { fetchMovieDetails };
