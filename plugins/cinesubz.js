const { cmd } = require("../command");  // import your command handler
const { fetchMovieDetails, fetchTVShowDetails, fetchEpisodeDetails } = require("../lib/cinesubz"); // adjust path
const axios = require("axios");

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
      if (!q) return reply("❌ Please provide the type and ID, e.g. `movie-123` or `tv-456` or `ep-789`");

      const [type, id] = q.split("-");
      if (!type || !id) return reply("❌ Invalid format. Use `movie-123`, `tv-456`, or `ep-789`");

      let details;

      switch (type.toLowerCase()) {
        case "movie":
          details = await fetchMovieDetails(id);
          reply(`🎬 *${details.title}*\n🗓 Release: ${details.release}\n⏱ Duration: ${details.duration}\n\n📥 Download Links:\n${details.downloadLinks.join("\n")}`);
          break;

        case "tv":
          details = await fetchTVShowDetails(id);
          reply(`📺 *${details.name}*\n🗓 Release: ${details.release}\n\n📥 Download Links:\n${details.downloadLinks.join("\n")}`);
          break;

        case "ep":
          details = await fetchEpisodeDetails(id);
          reply(`📺 Episode: *${details.title}*\n\n📥 Download Links:\n${details.downloadLinks.join("\n")}`);
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
