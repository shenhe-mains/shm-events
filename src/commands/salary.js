import { add_money, get_money, give_salary, last_salary } from "../db.js";
import { display_time, emojis } from "../utils.js";

export const command = {
    name: "salary",
    description: "Get your daily salary.",
    type: "CHAT_INPUT",
};

const min_salary = 500;
const max_salary = 1000;
const threshold = 5000;

export async function execute(interaction) {
    if (interaction.channel.id == "805458033471782980") {
        return "Please use this command in <#805458034251530262>.";
    }
    const last = await last_salary(interaction.user.id);
    const now = new Date();
    if (
        now.getDate() == last.getDate() &&
        now.getMonth() == last.getMonth() &&
        now.getYear() == last.getYear()
    ) {
        now.setDate(now.getDate() + 1);
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        return `You can only use this command once every day - next pay is ${display_time(
            now
        )}`;
    }
    await give_salary(interaction.user.id);
    var amount = Math.random() * (max_salary - min_salary) + min_salary;
    const broke = (await get_money(interaction.user.id)) < threshold;
    if (broke) {
        amount *= 1.5;
    }
    amount = Math.floor(amount);
    await add_money(interaction.user.id, amount);
    await interaction.reply({
        embeds: [
            {
                title: "Salary given",
                description: `You received ${amount} ${emojis.coin}${
                    broke ? " (+50% bonus for players with low funds)" : ""
                }.`,
                color: "GREEN",
            },
        ],
    });
}
