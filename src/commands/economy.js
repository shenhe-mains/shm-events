import { config } from "../config.js";
import { economy } from "../db.js";
import { emojis } from "../utils.js";

export const command = {
    name: "economy",
    description: "Show the server's richest users",
    type: "CHAT_INPUT",
    options: [
        {
            name: "page",
            description: "page number (default 1)",
            type: "INTEGER",
            minValue: 1,
            required: false,
        },
    ],
};

export async function execute(interaction) {
    if (interaction.channel.id == "805458033471782980") {
        return "Please use this command in <#805458034251530262>.";
    }
    await interaction.reply({
        embeds: [
            {
                title: "Economy",
                description: (
                    await economy(interaction.options.getInteger("page") || 1)
                )
                    .map(
                        (entry) =>
                            `<@${entry.user_id}>: ${entry.money} ${emojis.coin}`
                    )
                    .join("\n"),
                color: config.color,
            },
        ],
    });
}
