import { config } from "../../config.js";
import { list_xp_roles } from "../../db.js";
import { add_xp } from "../../events/messageCreate.js";

export const name = "war effort";
export const description =
    "Enlist help in the Ganyu vs. Ayaka event! Each unit is worth an hour of XP (only for your team).";
export const cost = 1000;
export const cooldown = 43200;
export const max = 0;
export const max_bulk = 1;

export async function validate(interaction, amount) {
    if (
        [...(await list_xp_roles())].some((role_id) =>
            interaction.member.roles.cache.has(role_id)
        )
    ) {
        return true;
    } else {
        await interaction.respond(
            "You must have one of the event team roles to do this!"
        );
        return false;
    }
}

export async function buy(interaction, amount) {
    await add_xp(interaction.member, amount * 300, true);
    await interaction.reply({
        embeds: [
            {
                title: "War Efforts purchased!",
                description: `${interaction.user} just purchased ${
                    amount * 10
                } hour${amount == 1 ? "" : "s"} worth of XP for their team!`,
                color: config.color,
            },
        ],
    });
}
