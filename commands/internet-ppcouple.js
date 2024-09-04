const {
    createAPIUrl
} = require("../tools/api.js");
const {
    getRandomElement
} = require("../tools/general.js");
const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");
const fetch = require("node-fetch");

module.exports = {
    name: "ppcouple",
    aliases: ["ppcp"],
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

        try {
            const apiUrl = createAPIUrl("https://raw.githubusercontent.com", `/ramadhankukuh/database/master/src/lainnya/ppcouple.json`, {});
            const response = await fetch(apiUrl);
            const data = await response.json();
            const result = getRandomElement(data);

            await Promise.all([
                ctx.reply({
                    image: {
                        url: result.male
                    },
                    mimetype: mime.contentType("png"),
                }),
                ctx.reply({
                    image: {
                        url: result.female
                    },
                    mimetype: mime.contentType("png")
                })
            ]);
        } catch (error) {
            console.error("Error:", error);
            if (error.status !== 200) return ctx.reply(global.msg.notFound);
            return ctx.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};