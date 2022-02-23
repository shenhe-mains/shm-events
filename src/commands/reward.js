import { add_money } from "../db.js";
import { add_xp } from "../events/messageCreate.js";
import { emojis } from "../utils.js";

export const command = {
    name: "reward",
    description:
        "Reward a user some team XP and money for completing a challenge.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "user",
            description: "the user to reward",
            type: "USER",
            required: true,
        },
        {
            name: "xp",
            description: "how much XP to reward",
            type: "INTEGER",
            minValue: 0,
            required: true,
        },
        {
            name: "money",
            description: "how much money to reward",
            type: "INTEGER",
            minValue: 0,
            required: true,
        },
    ],
};

export async function execute(interaction) {
    if (
        !interaction.member.roles.cache.has("805458032938188838") &&
        !interaction.member.roles.cache.has("805458032938188839")
    ) {
        return "Only moderators (<@&805458032938188838>) and admins (<@&805458032938188839>) are allowed to use this command!";
    }
    const member = interaction.options.getMember("user", true);
    const xp = interaction.options.getInteger("xp", true);
    const money = interaction.options.getInteger("money", true);
    await add_xp(member.id, xp, true);
    await add_money(member.id, money);
    await interaction.reply({
        embeds: [
            {
                title: "Reward Given!",
                description: `${member} was rewarded with ${xp} XP for their team and ${money} ${emojis.coin}`,
                color: "GREEN",
            },
        ],
    });
}
