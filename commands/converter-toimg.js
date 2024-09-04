const {
    createAPIUrl
} = require("../tools/api.js");
const {
    quote
} = require("@mengkodingan/ckptw");
const FormData = require("form-data");
const {
    JSDOM
} = require("jsdom");
const mime = require("mime-types");
const fetch = require("node-fetch");

module.exports = {
    name: "toimg",
    aliases: ["topng", "toimage"],
    category: "converter",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true
        });
        if (status) return ctx.reply(message);

        const quotedMessage = ctx.quoted;

        if (!quotedMessage) return ctx.reply(quote(`📌 Berikan atau balas media berupa sticker!`));

        try {
            const buffer = await quotedMessage.media.toBuffer()
            const imgUrl = buffer ? await webp2png(buffer) : null;

            if (!imgUrl) return ctx.reply(quote(`⚠ Terjadi kesalahan: Media tidak valid.`));

            return await ctx.reply({
                image: {
                    url: imgUrl
                },
                mimetype: mime.contentType("png")
            });
        } catch (error) {
            console.error("Error", error);
            return ctx.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};

async function webp2png(source) {
    let form = new FormData();
    let isUrl = typeof source === "string" && /https?:\/\//.test(source);
    const blob = !isUrl && Buffer.isBuffer(source) ? source : Buffer.from(source);
    form.append("new-image-url", isUrl ? blob : "");
    form.append("new-image", isUrl ? "" : blob, "image.webp");

    try {
        const res = await fetch("https://ezgif.com/webp-to-png", {
            method: "POST",
            body: form,
            headers: form.getHeaders(),
        });
        const html = await res.text();
        const {
            document
        } = new JSDOM(html).window;
        const form2 = new FormData();
        const obj = {};
        for (const input of document.querySelectorAll("form input[name]")) {
            obj[input.name] = input.value;
            form2.append(input.name, input.value);
        }

        const res2 = await fetch(`https://ezgif.com/webp-to-png/${obj.file}`, {
            method: "POST",
            body: form2,
            headers: form2.getHeaders(),
        });
        const html2 = await res2.text();
        const {
            document: document2
        } = new JSDOM(html2).window;
        return new URL(document2.querySelector("div#output > p.outfile > img").src, res2.url).toString();
    } catch (error) {
        console.error("Error in webp2png function:", error);
        return null;
    }
}