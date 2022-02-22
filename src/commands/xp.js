import { config } from "../config.js";
import {
    add_xp_role,
    block_channel_xp,
    clear_xp_roles,
    reset_user_xp,
    rm_xp_role,
    top_10_user_xp,
    unblock_channel_xp,
} from "../db.js";

export const command = {
    name: "xp",
    description: "Server XP commands.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "add",
            description: "Add a role to the XP leaderboard.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "role",
                    description: "the role to add",
                    type: "ROLE",
                    required: true,
                },
            ],
        },
        {
            name: "remove",
            description: "Remove a role from the XP leaderboard.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "role",
                    description: "the role to remove",
                    type: "ROLE",
                    required: true,
                },
            ],
        },
        {
            name: "reset",
            description: "Reset the XP leaderboard.",
            type: "SUB_COMMAND",
        },
        {
            name: "block",
            description: "Block a channel from receiving XP.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "channel",
                    description: "the channel to block",
                    type: "CHANNEL",
                    channelTypes: [
                        "GUILD_TEXT",
                        "GUILD_NEWS",
                        "GUILD_CATEGORY",
                    ],
                    required: true,
                },
            ],
        },
        {
            name: "unblock",
            description: "Unblock a channel from receiving XP.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "channel",
                    description: "the channel to unblock",
                    type: "CHANNEL",
                    channelTypes: [
                        "GUILD_TEXT",
                        "GUILD_NEWS",
                        "GUILD_CATEGORY",
                    ],
                    required: true,
                },
            ],
        },
        {
            name: "top",
            description: "Show the top 10 users' individual XP.",
            type: "SUB_COMMAND",
        },
    ],
};

export async function execute(interaction) {
    if (config.owners.indexOf(interaction.user.id) == -1) {
        return "Only bot owners can use xp commands.";
    }
    const role = interaction.options.getRole("role");
    const channel = interaction.options.getChannel("channel");
    switch (interaction.options.getSubcommand()) {
        case "add":
            await add_xp_role(role.id);
            return `${role} has been added to the leaderboard.`;
        case "remove":
            await rm_xp_role(role.id);
            return `${role} has been removed from the leaderboard.`;
        case "reset":
            await clear_xp_roles();
            await reset_user_xp();
            return `The leaderboard has been reset.`;
        case "block":
            await block_channel_xp(channel.id);
            return `Members will no longer receive XP for activity in ${channel}.`;
        case "unblock":
            await unblock_channel_xp(channel.id);
            return `Members will now begin receiving XP for activity in ${channel}.`;
        case "top":
            await interaction.reply({
                embeds: [
                    {
                        title: "Top Users (Individual XP)",
                        description:
                            "This XP leaderboard is hidden and only useful for things like deciding the rate of XP rewards to give.",
                        color: "ff0088",
                        fields: {
                            name: "_ _",
                            value:
                                (await top_10_user_xp())
                                    .map(
                                        (entry) =>
                                            `<@${entry.user_id}>: \`${entry.xp}\``
                                    )
                                    .join("\n") ||
                                "There is nobody on the leaderboard yet.",
                        },
                    },
                ],
                ephemeral: true,
            });
            return;
    }
}
