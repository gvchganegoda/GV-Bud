const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "song",
    desc: "Download YouTube song",
    category: "download",
    run: async (bot, message, args) => {
        try {
            const url = args[0];
            if (!ytdl.validateURL(url)) {
                return message.reply("Please provide a valid YouTube URL.");
            }

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
            const output = path.join(__dirname, `${title}.mp3`);

            const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
            const fileStream = fs.createWriteStream(output);

            stream.pipe(fileStream);

            fileStream.on('finish', () => {
                message.reply({ text: `Downloaded: ${title}`, file: output });
            });

            fileStream.on('error', (err) => {
                console.error(err);
                message.reply("Error saving the audio file.");
            });

        } catch (err) {
            console.error(err);
            message.reply("Failed to download the song.");
        }
    }
};
