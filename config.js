const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/gvchganegoda/GV-Bud/blob/main/images/gv%20bud.jpg?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 GV-Bud Is Alive Now😍*",
BOT_OWNER: '94787114501',  // Replace with the owner's phone number



};
