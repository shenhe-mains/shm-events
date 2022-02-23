import { add_money } from "../../db.js";
import { emojis } from "../../utils.js";

export const name = "lottery ticket (75% nothing, 20% double, 5% x5) - $100";
export const cost = 100;
export const cooldown = 3600;
export const max = 0;
export const max_bulk = 5;

export async function buy(interaction, amount) {
    var reward;
    if (Math.random() < 0.75) {
        reward = 0;
        await interaction.reply({
            embeds: [
                {
                    title: "Lottery Ticket - No Return",
                    description: "You got nothing back!",
                    color: "RED",
                },
            ],
        });
    } else if (Math.random() < 0.8) {
        reward = amount * cost * 2;
        await interaction.reply({
            embeds: [
                {
                    title: "Congratulations - Doubled",
                    description: `You got ${reward} ${emojis.coin} back!`,
                    color: "GREEN",
                },
            ],
        });
    } else {
        reward = amount * cost * 5;
        await interaction.reply({
            embeds: [
                {
                    title: "Jackpot - Quintupled (x5)",
                    description: `You got ${reward} ${emojis.coin} back!`,
                    color: "ff0088",
                },
            ],
        });
    }
    await add_money(interaction.user.id, reward);
}
