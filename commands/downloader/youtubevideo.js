const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");

module.exports = {
    name: "youtubevideo",
    aliases: ["ytmp4", "ytv", "ytvideo"],
    category: "downloader",
    handler: {
        coin: [10, "text", 1]
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const url = ctx.args[0] || null;

        if (!url) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used.prefix + ctx._used.command, "https://example.com/"))
        );

        const isUrl = await tools.general.isUrl(url);
        if (!isUrl) return await ctx.reply(config.msg.urlInvalid);

        try {
            const baseApiUrl = "https://ytdownloader.nvlgroup.my.id";
            const infoApiUrl = tools.api.createUrl(baseApiUrl, "/info", {
                url
            }, null, ["url"]);
            const infoData = (await axios.get(infoApiUrl)).data;

            await ctx.reply(
                `${quote(`Judul: ${infoData.title}`)}\n` +
                `${quote(`Uploader: ${infoData.uploader}`)}\n` +
                `${quote(`Durasi: ${infoData.duration}`)}\n` +
                `${quote(`Pilih resolusi:`)}\n` +
                `${infoData.resolutions.map((data, index) => quote(`${index + 1}. ${data.height} kbps (${data.size})`)).join("\n")}\n` +
                "\n" +
                global.config.msg.footer
            );

            const collector = ctx.MessageCollector({
                time: 60000
            });

            collector.on("collect", async (m) => {
                const selectedNumber = parseInt(m.content.trim());
                const selectedResolutionIndex = selectedNumber - 1;

                if (!isNaN(selectedNumber) && selectedResolutionIndex >= 0 && selectedResolutionIndex < infoData.resolutions.length) {
                    const selectedResolution = infoData.resolutions[selectedResolutionIndex].height;
                    const downloadApiUrl = tools.api.createUrl(baseApiUrl, "/download", {
                        url,
                        resolution: selectedResolution
                    }, null, ["url"]);

                    if (config.system.autoTypingOnCmd) ctx.simulateTyping();
                    await ctx.reply({
                        video: {
                            url: downloadApiUrl
                        },
                        mimetype: mime.contentType("mp4")
                    });
                    return collector.stop();
                }
            });

            collector.on("end", async () => {});
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            if (error.status !== 200) return await ctx.reply(config.msg.notFound);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};