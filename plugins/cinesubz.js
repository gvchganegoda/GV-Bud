const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Fetch movie details by ID
 */
async function fetchMovieDetails(id) {
  const url = `https://cinesubz.lk/movie/${id}`;
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  const title = $("h1.entry-title").text().trim();
  const release = $(".meta-date").text().trim();
  const duration = $(".meta-duration").text().trim();

  const downloadLinks = [];
  $(".download-links a").each((i, el) => {
    const link = $(el).attr("href");
    if (link) downloadLinks.push(link);
  });

  return { title, release, duration, downloadLinks };
}

/**
 * Fetch TV show details by ID
 */
async function fetchTVShowDetails(id) {
  const url = `https://cinesubz.lk/tvshow/${id}`;
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  const name = $("h1.entry-title").text().trim();
  const release = $(".meta-date").text().trim();

  const downloadLinks = [];
  $(".download-links a").each((i, el) => {
    const link = $(el).attr("href");
    if (link) downloadLinks.push(link);
  });

  return { name, release, downloadLinks };
}

/**
 * Fetch episode details by ID
 */
async function fetchEpisodeDetails(id) {
  const url = `https://cinesubz.lk/episode/${id}`;
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  const title = $("h1.entry-title").text().trim();

  const downloadLinks = [];
  $(".download-links a").each((i, el) => {
    const link = $(el).attr("href");
    if (link) downloadLinks.push(link);
  });

  return { title, downloadLinks };
}

module.exports = { fetchMovieDetails, fetchTVShowDetails, fetchEpisodeDetails };
