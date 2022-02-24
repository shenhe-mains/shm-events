import { config } from "../config.js";
import { leaderboard } from "../db.js";

export const command = {
    name: "leaderboard",
    description: "Show the current XP leaderboard.",
    type: "CHAT_INPUT",
};

export async function execute(interaction) {
    if (config.owners.indexOf(interaction.user.id) == -1) {
        return "This command has been temporarily disabled to avoid skewing the results and/or which team people decide to join. Sorry.";
    }
    const lb = [];
    for (const entry of await leaderboard()) {
        try {
            const role = await interaction.guild.roles.fetch(entry.role_id);
            if (role) lb.push({ role, xp: entry.xp });
        } catch {}
    }
    if (lb.length == 0) {
        await interaction.reply({
            embeds: [
                {
                    title: "Leaderboard",
                    description: "The leaderboard is not active right now.",
                    color: "RED",
                },
            ],
        });
    } else {
        const size = Math.max(...lb.map((entry) => entry.role.members.size));
        await interaction.reply({
            embeds: [
                {
                    title: "Leaderboard",
                    description: lb
                        .map((entry) => ({
                            role: entry.role,
                            xp: Math.round(
                                (entry.xp * size) / entry.role.members.size
                            ),
                        }))
                        .sort((a, b) => b.xp - a.xp)
                        .map((entry) => `${entry.role}: \`${entry.xp}\``)
                        .join("\n"),
                    color: config.color,
                },
            ],
        });
    }
}
