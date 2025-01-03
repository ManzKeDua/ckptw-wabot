const {
    quote
} = require("@mengkodingan/ckptw");
const {
    exec
} = require("child_process");
const util = require("util");

module.exports = {
    name: "restart",
    aliases: ["r"],
    category: "owner",
    handler: {
        owner: true
    },
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            await ctx.reply(config.msg.wait);

            await db.set(`bot.restart`, {
                jid: ctx.id,
                timestamp: Date.now()
            });

            return await util.promisify(exec)("pm2 restart $(basename $(pwd))"); // PM2
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};