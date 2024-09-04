const {
    createAPIUrl
} = require("../tools/api.js");
const {
    quote
} = require("@mengkodingan/ckptw");
const fetch = require("node-fetch");

module.exports = {
    name: "holiday",
    aliases: ["harilibur", "libur"],
    category: "tools",
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
            const month = new Date().getMonth() + 1;
            const apiUrl = createAPIUrl("https://api-harilibur.vercel.app", "/api", {
                month
            });
            const response = await fetch(apiUrl);
            const data = await response.json();

            const resultText = data.reverse().map((h) => {
                const d = new Date(h.holiday_date);
                const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
                const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

                const day = days[d.getDay()];
                const mon = months[d.getMonth()];
                const year = d.getFullYear();

                return `${bold(h.holiday_name)}\n` +
                    `${quote(`${day}, ${d.getDate()} ${mon} ${year}`)}`;
            }).join(
                "\n" +
                `${quote("─────")}\n`
            );
            return ctx.reply(
                `${resultText}\n` +
                "\n" +
                global.msg.footer
            );
        } catch (error) {
            console.error("Error:", error);
            if (error.status !== 200) return ctx.reply(global.msg.notFound);
            return ctx.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};