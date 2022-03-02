import {
    get_biggest_earner,
    get_biggest_loser,
    get_economy_change,
} from "../db.js";
import { emojis } from "../utils.js";

export const command = {
    name: "changes",
    description: "See changes to the economy since the last report",
    type: "CHAT_INPUT",
};

export async function execute(interaction) {
    if (interaction.channel.id == "805458033471782980") {
        return "Please use this command in <#805458034251530262>.";
    }
    await interaction.reply(await post_changes());
}

export async function post_changes() {
    const change = await get_economy_change();
    const winner = await get_biggest_earner();
    const loser = await get_biggest_loser();
    return {
        embeds: [
            {
                title: "Daily Economy Report",
                description:
                    `Since the last report, the net change in everyone's account was ${change} ${emojis.coin}\n\n` +
                    (winner
                        ? `The greatest changes were <@${winner.user_id}> with ${winner.money} ${emojis.coin} and <@${loser.user_id}> with ${loser.money} ${emojis.coin}`
                        : "Nobody had any monetary changes."),
                color: "ff00ff",
            },
        ],
    };
}
