const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');

const downloadMediaMessage = async (m, filename) => {
    if (m.type === 'viewOnceMessage') m.type = m.msg.type;

    let ext, name, stream;
    switch (m.type) {
        case 'imageMessage':
            name = filename ? filename + '.jpg' : 'undefined.jpg';
            stream = await downloadContentFromMessage(m.msg, 'image');
            break;
        case 'videoMessage':
            name = filename ? filename + '.mp4' : 'undefined.mp4';
            stream = await downloadContentFromMessage(m.msg, 'video');
            break;
        case 'audioMessage':
            name = filename ? filename + '.mp3' : 'undefined.mp3';
            stream = await downloadContentFromMessage(m.msg, 'audio');
            break;
        case 'stickerMessage':
            name = filename ? filename + '.webp' : 'undefined.webp';
            stream = await downloadContentFromMessage(m.msg, 'sticker');
            break;
        case 'documentMessage':
            ext = m.msg.fileName.split('.').pop().toLowerCase()
                .replace('jpeg', 'jpg').replace('png', 'jpg').replace('m4a', 'mp3');
            name = filename ? filename + '.' + ext : 'undefined.' + ext;
            stream = await downloadContentFromMessage(m.msg, 'document');
            break;
        default:
            throw new Error('Unsupported message type: ' + m.type);
    }

    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    fs.writeFileSync(name, buffer);
    return fs.readFileSync(name);
};

const sms = (danuwa, m) => {
    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.fromMe ? danuwa.user.id.split(':')[0] + '@s.whatsapp.net'
            : m.isGroup ? m.key.participant : m.key.remoteJid;
    }

    if (m.message) {
        m.type = getContentType(m.message);
        m.msg = m.type === 'viewOnceMessage'
            ? m.message[m.type].message[getContentType(m.message[m.type].message)]
            : m.message[m.type];

        if (m.msg) {
            if (m.type === 'viewOnceMessage') {
                m.msg.type = getContentType(m.message[m.type].message);
            }

            const quotedMsg = m.msg.contextInfo?.quotedMessage;
            if (quotedMsg) {
                m.quoted = {};
                m.quoted.msg = quotedMsg;
                m.quoted.type = getContentType(quotedMsg);
                m.quoted.id = m.msg.contextInfo.stanzaId;
                m.quoted.sender = m.msg.contextInfo.participant;
                m.quoted.fromMe = m.quoted.sender.split('@')[0] === danuwa.user.id.split(':')[0];

                m.quoted.key = {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                };

                m.quoted.download = (filename) => downloadMediaMessage(m.quoted, filename);
                m.quoted.delete = () => danuwa.sendMessage(m.chat, { delete: m.quoted.key });
                m.quoted.react = (emoji) => danuwa.sendMessage(m.chat, { react: { text: emoji, key: m.quoted.key } });
            }
        }

        m.download = (filename) => downloadMediaMessage(m, filename);
    }

    // Replies
    m.reply = (text, id = m.chat, option = { mentions: [m.sender] }) =>
        danuwa.sendMessage(id, { text, contextInfo: { mentionedJid: option.mentions } }, { quoted: m });

    m.replyS = (stik, id = m.chat, option = { mentions: [m.sender] }) =>
        danuwa.sendMessage(id, { sticker: stik, contextInfo: { mentionedJid: option.mentions } }, { quoted: m });

    m.replyImg = (img, text, id = m.chat, option = { mentions: [m.sender] }) =>
        danuwa.sendMessage(id, { image: img, caption: text, contextInfo: { mentionedJid: option.mentions } }, { quoted: m });

    m.replyVid = (vid, text, id = m.chat, option = { mentions: [m.sender], gif: false }) =>
        danuwa.sendMessage(id, { video: vid, caption: text, gifPlayback: option.gif, contextInfo: { mentionedJid: option.mentions } }, { quoted: m });

    m.replyAud = (aud, id = m.chat, option = { mentions: [m.sender], ptt: false }) =>
        danuwa.sendMessage(id, { audio: aud, ptt: option.ptt, mimetype: 'audio/mpeg', contextInfo: { mentionedJid: option.mentions } }, { quoted: m });

    m.replyDoc = (doc, id = m.chat, option = { mentions: [m.sender], filename: 'undefined.pdf', mimetype: 'application/pdf' }) =>
        danuwa.sendMessage(id, { document: doc, mimetype: option.mimetype, fileName: option.filename, contextInfo: { mentionedJid: option.mentions } }, { quoted: m });

    m.replyContact = (name, info, number) => {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
ORG:${info};
TEL;type=CELL;type=VOICE;waid=${number}:+${number}
END:VCARD`;
        danuwa.sendMessage(m.chat, { contacts: { displayName: name, contacts: [{ vcard }] } }, { quoted: m });
    };

    m.react = (emoji) => danuwa.sendMessage(m.chat, { react: { text: emoji, key: m.key } });

    return m;
};

module.exports = { sms, downloadMediaMessage };
