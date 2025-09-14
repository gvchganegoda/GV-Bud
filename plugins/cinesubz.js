const { cmd } = require("../command");
const { fetchMovieDetails, fetchTVShowDetails, fetchEpisodeDetails } = require("./cinesubz-plugin"); // your plugin path

cmd(
  {
    pattern: "cinesubz",
    react: "🎬",
    desc: "Fetch movies or TV series from Cinesubz",
    category: "download",
    filename: __filename,
  },
  async (
    gvbud,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      reply,
    }
  ) => {
    try {
      if (!q) return reply("❌ Please provide a movie/TV show ID");

      const type = args[0]?.toLowerCase(); // "movie", "tvshow", or "episode"
      const id = args[1]; // ID of the movie, tv show, or episode

      if (!type || !id) {
        return reply("❌ Usage: cinesubz <movie|tvshow|episode> <id>");
      }

      let data;

      if (type === "movie") {
        data = await fetchMovieDetails(id);
      } else if (type === "tvshow") {
        data = await fetchTVShowDetails(id);
      } else if (type === "episode") {
        data = await fetchEpisodeDetails(id);
      } else {
        return reply("❌ Invalid type. Use movie, tvshow, or episode.");
      }

      let message = `🎬 *Title:* ${data.title || data.name}\n`;
      if (data.release) message += `📅 *Released:* ${data.release}\n`;
      if (data.duration) message += `⏱️ *Duration:* ${data.duration}\n`;
      if (data.downloadLinks) {
        message += `🔗 *Download Links:*\n`;
        data.downloadLinks.forEach((link, i) => {
          message += `${i + 1}. ${link}\n`;
        });
      }

      await gvbud.sendMessage(
        from,
        { text: message },
        { quoted: mek }
      );

    } catch (error) {
      console.log(error);
      reply(`❌ Error: ${error.message}`);
    }
  }
);
