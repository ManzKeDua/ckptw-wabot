// Required modules and dependencies.
const {
    handler
} = require("./handler.js");
const gnrl = require("./tools/general.js");
const {
    bold,
    Client,
    CommandHandler,
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const {
    Events,
    MessageType
} = require("@mengkodingan/ckptw/lib/Constant");
const {
    S_WHATSAPP_NET
} = require("@whiskeysockets/baileys");
const {
    exec
} = require("child_process");
const didyoumean = require("didyoumean");
const path = require("path");
const SimplDB = require("simpl.db");
const {
    inspect
} = require("util");

// Connection message.
console.log("Connecting...");

// Create a new bot instance.
const bot = new Client({
    prefix: global.bot.prefix,
    readIncommingMsg: true,
    printQRInTerminal: !global.system.usePairingCode,
    phoneNumber: global.bot.phoneNumber,
    usePairingCode: global.system.usePairingCode,
    selfReply: true
});

// Create a new database instance.
const db = new SimplDB();
global.db = db;

// Event handling when the bot is ready.
bot.ev.once(Events.ClientReady, async (m) => {
    console.log(`Ready at ${m.user.id}`);
    global.system.startTime = Date.now();
});

// Create command handlers and load commands.
const cmd = new CommandHandler(bot, path.resolve(__dirname, "commands"));
cmd.load();

// Assign global handler.
global.handler = handler;

// Event handling when a message appears.
bot.ev.on(Events.MessagesUpsert, async (m, ctx) => {
    const isGroup = ctx.isGroup();
    const isPrivate = !isGroup;
    const senderJid = ctx._sender.jid;
    const senderNumber = ctx._sender.jid.replace(/@.*|:.*/g, '');
    const groupJid = isGroup ? m.key.remoteJid : null;
    const groupNumber = isGroup ? groupJid.split("@")[0] : null;

    // Ignore messages sent by the bot itself.
    if (m.key.fromMe);

    // Is commands?
    if (gnrl.isCmd(ctx, {
            m
        })) {
        // Auto-typing simulation for commands.
        await ctx.simulateTyping();

        // "Did you mean?" for typo commands.
        const content = m.content && m.content.trim();
        const prefix = content.charAt(0);
        const [cmdName] = content.slice(1).trim().toLowerCase().split(/\s+/);
        const cmd = ctx._config.cmd;
        const listCmd = Array.from(cmd.values()).flatMap(command => {
            const aliases = Array.isArray(command.aliases) ? command.aliases : [];
            return [command.name, ...aliases];
        });
        const mean = didyoumean(cmdName, listCmd);
        if (mean && mean !== cmdName) ctx.reply(quote(`${bold("[ ! ]")} Apakah maksud Anda ${monospace(prefix + mean)}?`));
    }

    // AFK handling: Mentioned users.
    const mentionJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (mentionJids && mentionJids.length > 0) {
        for (const mentionJid of mentionJids) {
            const getAFKMention = db.get(`user.${mentionJid.split("@")[0]}.afk`);
            if (getAFKMention) {
                const [reason, timeStamp] = await Promise.all([
                    db.get(`user.${mentionJid.split("@")[0]}.afk.reason`),
                    db.get(`user.${mentionJid.split("@")[0]}.afk.timeStamp`)
                ]);
                const timeAgo = gnrl.convertMsToDuration(Date.now() - timeStamp);

                ctx.reply(quote(`${bold("[ ! ]")} Dia AFK dengan alasan ${reason} selama ${timeAgo || "kurang dari satu detik."}.`));
            }
        }
    }

    // AFK handling: Leaving from AFK.
    const getAFKMessage = await db.get(`user.${senderNumber}.afk`);
    if (getAFKMessage) {
        const [reason, timeStamp] = await Promise.all([
            db.get(`user.${senderNumber}.afk.reason`),
            db.get(`user.${senderNumber}.afk.timeStamp`)
        ]);
        const timeAgo = gnrl.convertMsToDuration(Date.now() - timeStamp);
        await db.delete(`user.${senderNumber}.afk`);

        ctx.reply(quote(`${bold("[ ! ]")} Anda mengakhiri AFK dengan alasan ${reason} selama ${timeAgo || "kurang dari satu detik."}.`));
    }

    // Owner-only commands.
    if (gnrl.isOwner(ctx, {
            id: senderNumber,
            selfOwner: true // Warning! (Spam)
        }) === 1) {
        // Eval command: Execute JavaScript code.
        if (m.content && m.content.startsWith && (m.content.startsWith("> ") || m.content.startsWith(">> "))) {
            const code = m.content.slice(2);

            try {
                const result = await eval(m.content.startsWith(">> ") ? `(async () => { ${code} })()` : code);

                await ctx.reply(inspect(result));
            } catch (error) {
                console.error("Error:", error);
                ctx.reply(quote(`${bold("[ ! ]")} Terjadi kesalahan: ${error.message}`));
            }
        }

        // Exec command: Execute shell commands.
        if (m.content && m.content.startsWith && m.content.startsWith("$ ")) {
            const command = m.content.slice(2);

            try {
                const output = await new Promise((resolve, reject) => {
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            reject(new Error(`Error: ${error.message}`));
                        } else if (stderr) {
                            reject(new Error(stderr));
                        } else {
                            resolve(stdout);
                        }
                    });
                });

                await ctx.reply(output);
            } catch (error) {
                console.error("Error:", error);
                ctx.reply(quote(`${bold("[ ! ]")} Terjadi kesalahan: ${error.message}`));
            }
        }
    }

    // Group-specific actions.
    if (isGroup) {
        // Antilink handling.
        const getAntilink = await db.get(`group.${groupNumber}.antilink`);
        const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)\b/i;
        if (getAntilink && m.content && urlRegex.test(m.content)) {
            if ((await gnrl.isAdmin(ctx)) === 1);

            await ctx.reply(quote(`${bold("[ ! ]")} ${bold("[ ! ]")} Jangan kirim tautan!`));
            await ctx.deleteMessage(m.key);
        }
    }

    // Private messages.
    if (isPrivate) {
        // Menfess handling.
        const getMessageDataMenfess = await db.get(`menfess.${senderNumber}`);
        if (getMessageDataMenfess) {
            const [from, text] = await Promise.all([
                db.get(`menfess.${senderNumber}.from`),
                db.get(`menfess.${senderNumber}.text`)
            ]);

            if (ctx.quoted?.extendedTextMessage?.text === text) {
                try {
                    await sendMenfess(ctx, m, senderNumber, from);

                    ctx.reply(quote(`${bold("[ ! ]")} Pesan berhasil terkirim!`));
                } catch (error) {
                    console.error("Error:", error);
                    ctx.reply(quote(`${bold("[ ! ]")} Terjadi kesalahan: ${error.message}`));
                }
            }
        }
    }
});

// Event handling when a user joins or leaves a group
bot.ev.on(Events.UserJoin, (m) => {
    m.eventsType = "UserJoin";
    handleUserEvent(m);
});

bot.ev.on(Events.UserLeave, (m) => {
    m.eventsType = "UserLeave";
    handleUserEvent(m);
});


// Launch the bot.
bot.launch().catch((error) => console.error("Error:", error));

// Utility functions
async function sendMenfess(ctx, m, senderNumber, from) {
    const fakeText = {
        key: {
            fromMe: false,
            participant: senderNumber + S_WHATSAPP_NET,
            ...({
                remoteJid: "status@broadcast"
            })
        },
        message: {
            extendedTextMessage: {
                text: `${senderNumber} telah merespons pesan menfess Anda.`,
                title: global.bot.name,
                thumbnailUrl: global.bot.thumbnail

            }
        }
    }

    await ctx.sendMessage(
        ctx.id, {
            text: `${m.content}\n` +
                `${global.msg.readmore}\n` +
                "Jika ingin membalas, Anda harus mengirimkan perintah lagi.",
            contextInfo: {
                mentionedJid: [senderNumber + S_WHATSAPP_NET],
                externalAdReply: {
                    mediaType: 1,
                    previewType: 0,
                    mediaUrl: global.bot.groupChat,
                    title: global.msg.watermark,
                    body: null,
                    renderLargerThumbnail: true,
                    thumbnailUrl: global.bot.thumbnail,
                    sourceUrl: global.bot.groupChat
                },
                forwardingScore: 9999,
                isForwarded: true
            },
            mentions: [senderNumber + S_WHATSAPP_NET]
        }, {
            quoted: fakeText
        }
    );
}

async function handleUserEvent(m) {
    const {
        id,
        participants
    } = m;

    try {
        const getWelcome = await db.get(`group.${id.split("@")[0]}.welcome`);
        if (getWelcome) {
            const metadata = await bot.core.groupMetadata(id);

            for (const jid of participants) {
                let profileUrl;
                try {
                    profileUrl = await bot.core.profilePictureUrl(jid, "image");
                } catch {
                    profileUrl = "https://i.ibb.co/3Fh9V6p/avatar-contact.png";
                }

                const message = m.eventsType === "UserJoin" ? quote(`${bold("[ ! ]")} Selamat datang @${jid.split("@")[0]} di grup ${metadata.subject}!`) : quote(`${bold("[ ! ]")} @${jid.split("@")[0]} keluar dari grup ${metadata.subject}.`);

                await bot.core.sendMessage(id, {
                    text: message,
                    contextInfo: {
                        mentionedJid: [jid],
                        externalAdReply: {
                            mediaType: 1,
                            previewType: 0,
                            mediaUrl: global.bot.groupChat,
                            title: m.eventsType === "UserJoin" ? "JOIN" : "LEAVE",
                            body: null,
                            renderLargerThumbnail: true,
                            thumbnailUrl: profileUrl,
                            sourceUrl: global.bot.groupChat
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error:", error);
        bot.core.sendMessage(id, {
            text: quote(`${bold("[ ! ]")} Terjadi kesalahan: ${error.message}`)
        });
    }
}