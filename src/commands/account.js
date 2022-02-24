import { config } from "../config.js";
import { get_money } from "../db.js";
import { emojis } from "../utils.js";

export const command = {
    name: "account",
    description: "View account information for yourself or another user.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "user",
            description: "the user to view",
            type: "USER",
            required: false,
        },
    ],
};

export async function execute(interaction) {
    if (interaction.channel.id == "805458033471782980") {
        return "Please use this command in <#805458034251530262>.";
    }
    const member = interaction.options.getMember("user") || interaction.member;
    await interaction.reply({
        embeds: [
            {
                title: `${member.user.tag}'s account`,
                description: `${member} has ${await get_money(member.id)} ${
                    emojis.coin
                }`,
                color: config.color,
            },
        ],
    });
}
