const { exec } = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "song",
    desc: "Download YouTube song",
    category: "download",
    run: async (bot, message, args) => {
        try {
            const url = args[0];
            if (!url) return message.reply("Send a valid YouTube link.");

            // Temporary file name
            const output = path.join(__dirname, `song.mp3`);

            // Download audio only
            await exec(url, {
                output: output,
                extractAudio: true,
                audioFormat: "mp3",
                audioQuality: 0
            });

            // Send the audio file
            await bot.sendMessage(message.from, {
                audio: fs.readFileSync(output),
                mimetype: "audio/mpeg",
                fileName: "song.mp3"
            });

            // Delete temp file
            fs.unlinkSync(output);

        } catch (err) {
            console.error(err);
            message.reply("Failed to download the song.");
        }
    }
};
