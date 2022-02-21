import { add_money, get_money } from "../db.js";
import { emojis } from "../utils.js";

export const command = {
    name: "pay",
    description: "Give a user some money from your account.",
    type: "TEXT_INPUT",
    options: [
        {
            name: "recipient",
            description: "the user to pay",
            type: "USER",
            required: true,
        },
        {
            name: "amount",
            description: "the amount to pay",
            type: "INTEGER",
            minValue: 1,
            required: true,
        },
    ],
};

export async function execute(interaction) {
    const target = interaction.options.getMember("recipient", true);
    const amount = interaction.options.getInteger("amount");
    if ((await get_money(interaction.user.id)) < amount) {
        await interaction.reply({
            embeds: [
                {
                    title: "Insufficient Funds!",
                    description: "You do not have enough money to do that.",
                    color: "RED",
                },
            ],
        });
    } else {
        await add_money(interaction.user.id, -amount);
        await add_money(target.id, amount);
        await interaction.reply({
            embeds: [
                {
                    title: "Transaction complete!",
                    description: `${interaction.user} paid ${target} ${amount} ${emojis.coin}`,
                    color: "GREEN",
                },
            ],
        });
    }
}
