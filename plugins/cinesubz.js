const { cmd, replyHandlers } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// In-memory cache for each user's search session
const searchCache = {};

// Search CineSubz by movie name
async function searchMovies(query) {
  const url = `https://cinesubz.lk/?s=${encodeURIComponent(query)}`;
  const res = await axios.get(url).catch(() => null);
  if (!res) throw new Error("Search failed");

  const $ = cheerio.load(res.data);
  const results = [];

  $(".movie-list .movie-item").each((i, el) => {
    const title = $(el).find("h2").text().trim();
    const link = $(el).find("a").attr("href");
    if (title && link) results.push({ title, link });
  });

  return results;
}

// Fetch movie details and download links from a CineSubz page
async function fetchMovieDetailsFromUrl(url) {
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

// Download and send as WhatsApp document
async function sendDocument(gvbud, from, link, title) {
  try {
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

    await gvbud.sendMessage(from, {
      document: fs.readFileSync(tempPath),
      fileName: `${title}.mp4`,
      mimetype: "video/mp4",
    });

    fs.unlinkSync(tempPath);
  } catch (err) {
    console.error("Document send error:", err);
    gvbud.sendMessage(from, {
      text: `❌ Failed to send document. Here is the direct link:\n${link}`,
    });
  }
}

// Command: search movies
cmd(
  {
    pattern: "cinesubz",
    react: "🎬",
    desc: "Search and download movies from cinesubz.lk",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("❌ Provide a movie name to search, e.g., `Flask`");

      const results = await searchMovies(q);
      if (!results.length) return reply("❌ No results found.");

      // Cache search results per user
      searchCache[from] = results;

      // Prepare numbered search results with first available quality
      let msg = "🔎 Search results:\n";
      results.forEach((r, i) => {
        msg += `${i + 1}. ${r.title}\n`;
      });
      msg += "\nReply with the number to see available qualities.";

      await reply(msg);
    } catch (err) {
      console.error("Search error:", err);
      reply(`❌ Error searching movies: ${err.message}`);
    }
  }
);

// Reply handler: user selects a movie number
replyHandlers.push({
  filter: (text, { sender }) => {
    return searchCache[sender] && /^\d+$/.test(text.trim());
  },
  function: async (gvbud, mek, m, { reply, sender, body }) => {
    try {
      const index = parseInt(body.trim(), 10) - 1;
      const results = searchCache[sender];

      if (index < 0 || index >= results.length) return reply("❌ Invalid number.");

      const movie = results[index];
      const details = await fetchMovieDetailsFromUrl(movie.link);

      // Cache the movie download links for quality selection
      searchCache[sender] = { movie: details };

      // Send list of qualities
      let msg = `🎬 *${details.title}*\n🗓 Release: ${details.release}\n⏱ Duration: ${details.duration}\n\n📥 Available qualities:\n`;
      details.downloadLinks.forEach((d, i) => {
        msg += `${i + 1}. ${d.quality}\n`;
      });
      msg += "\nReply with the number of quality to download as document.";

      await reply(msg);
    } catch (err) {
      console.error("Movie selection error:", err);
      reply(`❌ Error fetching movie: ${err.message}`);
    }
  },
});

// Reply handler: user selects quality to download
replyHandlers.push({
  filter: (text, { sender }) => {
    return searchCache[sender]?.movie && /^\d+$/.test(text.trim());
  },
  function: async (gvbud, mek, m, { reply, sender, body }) => {
    try {
      const details = searchCache[sender].movie;
      const index = parseInt(body.trim(), 10) - 1;

      if (index < 0 || index >= details.downloadLinks.length)
        return reply("❌ Invalid quality number.");

      const selectedLink = details.downloadLinks[index].link;
      await reply(`⚡ Downloading *${details.title}* (${details.downloadLinks[index].quality})...`);
      await sendDocument(gvbud, sender, selectedLink, details.title);

      // Clear cache for user
      delete searchCache[sender];
    } catch (err) {
      console.error("Download error:", err);
      reply(`❌ Error downloading movie: ${err.message}`);
    }
  },
});

module.exports = { searchMovies, fetchMovieDetailsFromUrl };
