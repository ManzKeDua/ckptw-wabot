const {
    createAPIUrl
} = require("../tools/api.js");
const {
    bold,
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");
const fetch = require("node-fetch");

module.exports = {
    name: "ytsearch",
    aliases: ["yts"],
    category: "internet",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true,
            coin: 3
        });
        if (status) return ctx.reply(message);

        const input = ctx.args.join(" ") || null;

        if (!input) return ctx.reply(
            `${quote(global.msg.argument)}\n` +
            quote(`Contoh: ${monospace(`${ctx._used.prefix + ctx._used.command} neon genesis evangelion`)}`)
        );

        try {
            const apiUrl = createAPIUrl("agatz", "/api/ytsearch", {
                message: input
            });
            const response = await fetch(apiUrl);
            const {
                data
            } = await response.json();

            const resultText = data
                .map((d) => {
                    switch (d.type) {
                        case "video":
                            return `${bold(`${d.title} (${d.url})`)}\n` +
                                `${quote(`Durasi: ${d.timestamp}`)}\n` +
                                `${quote(`Diunggah: ${d.ago}`)}\n` +
                                `${quote(`Dilihat: ${d.views}`)}`;
                        case "channel":
                            return `${bold(`${d.name} (${d.url})`)}\n` +
                                `${quote(`Subscriber: ${d.subCountLabel} (${d.subCount})`)}\n` +
                                `${quote(`Jumlah video: ${d.videoCount}`)}`;
                    }
                })
                .filter((d) => d)
                .join("\n" + `${quote("─────")}\n`);

            return ctx.reply(`${resultText}\n\n` + global.msg.footer);
        } catch (error) {
            console.error("Error:", error);
            if (error.status !== 200) return ctx.reply(global.msg.notFound);
            return ctx.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};