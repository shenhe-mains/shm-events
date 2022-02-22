import {
    enter_giveaway,
    get_giveaway_entrant,
    giveaway_allows,
    giveaway_by_id,
} from "../db.js";
import { disable_buttons } from "../utils.js";

export async function handle(interaction) {
    // giveaway
    if (
        interaction.isButton() &&
        interaction.customId.startsWith("giveaway.")
    ) {
        const [_, id] = interaction.customId.split(".");
        const giveaway = await giveaway_by_id(id);
        if (!giveaway) {
            await interaction.message.edit({ components: [] });
            return "That giveaway does not seem to exist. Sorry.";
        }
        if (giveaway.end_date < new Date()) {
            await disable_buttons(interaction.message);
            return "That giveaway is no longer open. Sorry.";
        }
        var allowed = false;
        for (const snowflake of [
            interaction.user.id,
            ...interaction.member.roles.cache.keys(),
        ]) {
            if (await giveaway_allows(id, snowflake)) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            return "Sorry, you are not allowed to enter this giveaway.";
        }
        const { last_entered, tickets } = await get_giveaway_entrant(
            id,
            interaction.user.id
        );
        if (tickets >= giveaway.max_tickets) {
            return "You have already entered the maximum number of times.";
        }
        if (new Date() - last_entered < giveaway.cooldown * 60000) {
            return `You can enter again <t:${
                Math.floor(last_entered.getTime() / 1000) +
                giveaway.cooldown * 60
            }:R>`;
        }
        await enter_giveaway(id, interaction.user.id);
        return (
            `Success! You now have ${tickets + 1} ticket${
                tickets == 0 ? "" : "s"
            }.` +
            (tickets < giveaway.max_tickets
                ? ` You can enter again <t:${
                      Math.floor(new Date().getTime() / 1000) +
                      giveaway.cooldown * 60
                  }:R>.`
                : "")
        );
    }
}
