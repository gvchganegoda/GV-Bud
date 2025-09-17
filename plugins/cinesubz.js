const { cmd } = require("../command"); // command handler
const axios = require("axios");
const cheerio = require("cheerio");

async function fetchMovieDetails(id) {
  const url = `https://cinesubz.lk/movies/${id}`;
  const res = await axios.get(url).catch(() => null);
  if (!res) throw new Error("Movie not found");

  const $ = cheerio.load(res.data);

  const title = $("h1").first().text().trim();
  const release = $(".movie-info .release-date").text().trim() || "Unknown";
  const duration = $(".movie-info .duration").text().trim() || "Unknown";

  const downloadLinks = [];
  $(".download-links a").each((i, el) => {
    downloadLinks.push($(el).attr("href"));
  });

  return { title, release, duration, downloadLinks };
}

async function fetchTVShowDetails(id) {
  const url = `https://cinesubz.lk/tv-shows/${id}`;
  const res = await axios.get(url).catch(() => null);
  if (!res) throw new Error("TV show not found");

  const $ = cheerio.load(res.data);

  const name = $("h1").first().text().trim();
  const release = $(".tv-info .release-date").text().trim() || "Unknown";

  const downloadLinks = [];
  $(".download-links a").each((i, el) => {
    downloadLinks.push($(el).attr("href"));
  });

  return { name, release, downloadLinks };
}

async function fetchEpisodeDetails(id) {
  const url = `https://cinesubz.lk/episodes/${id}`;
  const res = await axios.get(url).catch(() => null);
  if (!res) throw new Error("Episode not found");

  const $ = cheerio.load(res.data);

  const title = $("h1").first().text().trim();
  const downloadLinks = [];
  $(".download-links a").each((i, el) => {
    downloadLinks.push($(el).attr("href"));
  });

  return { title, downloadLinks };
}

cmd(
  {
    pattern: "cinesubz",
    react: "🎬",
    desc: "Fetch movie/TV/episode details from cinesubz.lk",
    category: "download",
    filename: __filename,
  },
  async (gvbud, mek, m, { from, reply, q }) => {
    try {
      if (!q)
        return reply(
          "❌ Please provide the type and ID, e.g. `movie-avatar-2025`, `tv-stranger-things`, or `ep-s1e1`"
        );

      const [type, ...idParts] = q.split("-");
      const id = idParts.join("-");
      if (!type || !id)
        return reply(
          "❌ Invalid format. Use `movie-avatar-2025`, `tv-stranger-things`, or `ep-s1e1`"
        );

      let details;

      switch (type.toLowerCase()) {
        case "movie":
          details = await fetchMovieDetails(id);
          reply(
            `🎬 *${details.title}*\n🗓 Release: ${details.release}\n⏱ Duration: ${details.duration}\n\n📥 Download Links:\n${details.downloadLinks.join(
              "\n"
            )}`
          );
          break;

        case "tv":
          details = await fetchTVShowDetails(id);
          reply(
            `📺 *${details.name}*\n🗓 Release: ${details.release}\n\n📥 Download Links:\n${details.downloadLinks.join(
              "\n"
            )}`
          );
          break;

        case "ep":
          details = await fetchEpisodeDetails(id);
          reply(
            `📺 Episode: *${details.title}*\n\n📥 Download Links:\n${details.downloadLinks.join(
              "\n"
            )}`
          );
          break;

        default:
          reply("❌ Invalid type. Use `movie`, `tv`, or `ep`.");
          break;
      }
    } catch (err) {
      console.error("Cinesubz plugin error:", err);
      reply(`❌ Error fetching details: ${err.message}`);
    }
  }
);

module.exports = { fetchMovieDetails, fetchTVShowDetails, fetchEpisodeDetails };
