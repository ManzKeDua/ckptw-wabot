const {
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");

module.exports = {
    name: "bagoodex",
    category: "ai-chat",
    handler: {
        coin: [10, "text", 1]
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        const input = ctx.args.join(" ") || null;

        if (!input) return await ctx.reply(
            `${quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.msg.generateCommandExample(ctx._used.prefix + ctx._used.command, "apa itu bot whatsapp?"))
        );

        try {
            const senderId = ctx.sender.jid.split(/[:@]/)[0];
            const uid = await db.get(`user.${senderId}.uid`) || "guest";
            const apiUrl = tools.api.createUrl("fasturl", "/aillm/bagoodex", {
                ask: input,
                style: `You are a WhatsApp bot named ${config.bot.name}, owned by ${config.owner.name}. Be friendly, informative, and engaging.`, // Dapat diubah sesuai keinginan Anda
                sessionId: uid
            });
            const {
                data
            } = await axios.get(apiUrl, {
                headers: {
                    "x-api-key": tools.api.listUrl().fasturl.APIKey
                }
            });

            return await ctx.reply(data.result);
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            if (error.status !== 200) return await ctx.reply(config.msg.notFound);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};