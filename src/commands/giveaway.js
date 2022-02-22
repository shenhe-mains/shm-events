import { client } from "../client.js";
import { config } from "../config.js";
import {
    active_giveaways,
    close_giveaway,
    create_giveaway,
    delete_giveaway,
    get_entrants,
    get_giveaway,
    get_giveaway_weight,
    giveaway_allow,
    giveaway_disallow,
    giveaway_titles,
    giveaway_weight,
    is_posted,
    post_giveaway,
    remove_entrant,
    set_giveaway_message,
    unposted_giveaway_titles,
} from "../db.js";
import {
    ac_substring,
    disable_buttons,
    display_time,
    english_join,
} from "../utils.js";

const title_option = {
    name: "title",
    description: "the title of the giveaway",
    type: "STRING",
    required: true,
    autocomplete: true,
};

export const command = {
    name: "giveaway",
    description: "Giveaway commands.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "create",
            description:
                "Create a new giveaway. It will not be posted until you use the post command.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "title",
                    description: "the title for the giveaway + embed",
                    type: "STRING",
                    required: true,
                },
                {
                    name: "description",
                    description: "the description for the embed",
                    type: "STRING",
                    required: true,
                },
                {
                    name: "duration",
                    description:
                        "the amount of time in minutes to keep the giveaway open for (from when it is posted, not from now)",
                    type: "INTEGER",
                    required: true,
                    minValue: 1,
                },
                {
                    name: "cooldown",
                    description:
                        "the amount of time in minutes between when users can submit tickets (default: 1)",
                    type: "INTEGER",
                    minValue: 1,
                },
                {
                    name: "max_tickets",
                    description:
                        "the maximum number of tickets each user can have",
                    type: "INTEGER",
                    minValue: 1,
                },
            ],
        },
        {
            name: "allow",
            description: "Allow a user or role to enter the giveaway.",
            type: "SUB_COMMAND",
            options: [
                title_option,
                {
                    name: "user_or_role",
                    description: "the user or role to allow",
                    type: "MENTIONABLE",
                    required: true,
                },
            ],
        },
        {
            name: "disallow",
            description:
                "Disallow a user or role from entering the giveaway (a user may still enter with a permitted role).",
            type: "SUB_COMMAND",
            options: [
                title_option,
                {
                    name: "user_or_role",
                    description: "the user or role to disallow",
                    type: "MENTIONABLE",
                    required: true,
                },
            ],
        },
        {
            name: "weight",
            description:
                "Set the weight for a user or role. Each user receives the highest weight they possess (or 1).",
            type: "SUB_COMMAND",
            options: [
                title_option,
                {
                    name: "user_or_role",
                    description: "the user or role to assign a weight to",
                    type: "MENTIONABLE",
                    required: true,
                },
                {
                    name: "weight",
                    description: "the weight to assign",
                    type: "NUMBER",
                    required: true,
                    minValue: 0,
                },
            ],
        },
        {
            name: "post",
            description: "Post a giveaway.",
            type: "SUB_COMMAND",
            options: [
                title_option,
                {
                    name: "channel",
                    description: "where to post it (default here)",
                    type: "CHANNEL",
                    channelTypes: [
                        "GUILD_TEXT",
                        "GUILD_NEWS",
                        "GUILD_NEWS_THREAD",
                        "GUILD_PUBLIC_THREAD",
                        "GUILD_PRIVATE_THREAD",
                    ],
                },
            ],
        },
        {
            name: "delete",
            description: "Delete the giveaway.",
            type: "SUB_COMMAND",
            options: [title_option],
        },
        {
            name: "draw",
            description:
                "Draw the ticket(s) for a giveaway. Successful entrants are removed after each draw.",
            type: "SUB_COMMAND",
            options: [
                title_option,
                {
                    name: "amount",
                    description: "the number of entrants to draw (default 1)",
                    type: "INTEGER",
                    minValue: 1,
                },
            ],
        },
    ],
};

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const title = await interaction.options.getString("title");
    if (sub == "create") {
        if (title.length > 128) {
            return "The title must be at most 128 characters long.";
        }
        const description = interaction.options.getString("description");
        if (description.length > 1024) {
            return "The description must be at most 1024 characters long.";
        }
        const id = await create_giveaway(
            title,
            description,
            interaction.options.getInteger("duration") || 1,
            interaction.options.getInteger("cooldown") || 1,
            interaction.options.getInteger("max_tickets") || 1
        );
        await interaction.respond(
            `Your giveaway has been created (id \`${id}\`).`
        );
    } else {
        const giveaway = await get_giveaway(title);
        if (!giveaway) {
            return "There is no giveaway by that title.";
        }
        const user_or_role = interaction.options.getMentionable("user_or_role");
        const weight = interaction.options.getNumber("weight");
        switch (sub) {
            case "allow":
                await giveaway_allow(giveaway.id, user_or_role.id);
                return `${user_or_role} is now allowed to enter the giveaway titled \`${giveaway.title}\`.`;
            case "disallow":
                await giveaway_disallow(giveaway.id, user_or_role.id);
                return `${user_or_role} is no longer allowed to enter the giveaway titled \`${giveaway.title}\`, but existing tickets are not revoked.`;
            case "weight":
                await giveaway_weight(giveaway.id, user_or_role.id, weight);
                return `${user_or_role} will be given a weight of ${weight} for the giveaway titled \`${giveaway.title}\`.`;
            case "post":
                if (await is_posted(giveaway.id)) {
                    return "This giveaway has already been posted.";
                }
                giveaway.end_date = await post_giveaway(giveaway.id);
                const giveaway_message = await (
                    interaction.options.getChannel("channel") ||
                    interaction.channel
                ).send({
                    embeds: [
                        {
                            title: giveaway.title,
                            description:
                                giveaway.description +
                                "\n\nEnds: " +
                                display_time(giveaway.end_date),
                            color: config.color,
                        },
                    ],
                    components: [
                        {
                            type: "ACTION_ROW",
                            components: [
                                {
                                    type: "BUTTON",
                                    style: "PRIMARY",
                                    customId: `giveaway.${giveaway.id}`,
                                    label: "Enter!",
                                },
                            ],
                        },
                    ],
                });
                await set_giveaway_message(giveaway.id, giveaway_message);
                schedule_close(await get_giveaway(giveaway.title));
                return `Posted!`;
            case "delete":
                await delete_giveaway(giveaway.id);
                return "Deleted. Please remember to delete the message if necessary.";
            case "draw":
                const winners = [];
                for (
                    var x = interaction.options.getInteger("amount") || 1;
                    x > 0;
                    --x
                ) {
                    const winner = await draw(interaction.guild, giveaway);
                    if (winner === undefined) break;
                    winners.push(winner);
                }
                await interaction.reply({
                    embeds: [
                        {
                            title: "Giveaway Winners",
                            description: `Congratulations to ${english_join(
                                winners
                            )} for winning the \`${giveaway.title}\` giveaway!`,
                            color: config.color,
                        },
                    ],
                });
                return;
        }
    }
}

async function draw(guild, giveaway) {
    const entrants = [];
    var total = 0;
    const weights = new Map();
    for (const { user_id, tickets } of await get_entrants(giveaway.id)) {
        try {
            const member = await guild.members.fetch(user_id);
            var weight = await get_giveaway_weight(giveaway.id, user_id);
            for (const role of member.roles.cache) {
                if (!weights.has(role.id)) {
                    weights.set(
                        role.id,
                        await get_giveaway_weight(giveaway.id, role.id)
                    );
                }
                const role_weight = weights.get(role.id);
                if (weight === undefined || role_weight > weight) {
                    weight = role_weight;
                }
            }
            if (weight === 0) continue;
            if (weight === undefined) weight = 1;
            entrants.push({ member, weight: weight * tickets });
            total += weight;
        } catch {}
    }
    if (entrants.length == 0) return undefined;
    var random = Math.random() * total;
    for (const entrant of entrants) {
        if (random < entrant.weight) {
            await remove_entrant(giveaway.id, entrant.member.id);
            return entrant.member;
        }
        random -= entrant.weight;
    }
}

export async function autocomplete(interaction) {
    await ac_substring(
        interaction,
        interaction.options.getSubcommand() == "post"
            ? await unposted_giveaway_titles()
            : await giveaway_titles()
    );
}

async function do_close_giveaway(giveaway) {
    try {
        const channel = await client.channels.fetch(giveaway.channel_id);
        const message = await channel.messages.fetch(giveaway.message_id);
        await disable_buttons(message);
        await close_giveaway(giveaway.id);
    } catch {}
}

function schedule_close(giveaway) {
    setTimeout(
        () => do_close_giveaway(giveaway),
        giveaway.end_date - new Date()
    );
}

active_giveaways().then((giveaways) => {
    for (const giveaway of giveaways) {
        schedule_close(giveaway);
    }
});
