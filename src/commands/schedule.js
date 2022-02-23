import { add_event, delete_event, post_event } from "../db.js";

export const type = {
    name: "type",
    description: "the type of event",
    type: "STRING",
    required: true,
    choices: ["trivia"],
};

export const channel = {
    name: "channel",
    description: "where to host the event",
    type: "CHANNEL",
    required: true,
    channelTypes: [
        "GUILD_TEXT",
        "GUILD_NEWS",
        "GUILD_NEWS_THREAD",
        "GUILD_PUBLIC_THREAD",
        "GUILD_PRIVATE_THREAD",
    ],
};

export const command = {
    name: "schedule",
    description: "Random event scheduling commands.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "create",
            description: "Schedule an event (or edit the current event).",
            type: "SUB_COMMAND",
            options: [
                type,
                channel,
                {
                    name: "min",
                    description: "minimum delay (minutes)",
                    type: "INTEGER",
                    minValue: 1,
                    required: true,
                },
                {
                    name: "max",
                    description: "maximum delay (minutes)",
                    type: "INTEGER",
                    minValue: 1,
                    required: true,
                },
                {
                    name: "skip",
                    description: "whether or not to skip posting right now",
                    type: "BOOLEAN",
                },
            ],
        },
        {
            name: "delete",
            description: "Delete an event.",
            type: "SUB_COMMAND",
            options: [type, channel],
        },
    ],
};

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const type = interaction.options.getString("type");
    const channel = interaction.options.getChannel("channel");
    if (!types[type]) return "That event type does not exist.";
    if (sub == "create") {
        var min, max;
        await add_event(
            channel.id,
            type,
            (min = interaction.options.getInteger("min")),
            (max = interaction.options.getInteger("max"))
        );
        await post_event(channel.id, type);
        if (!interaction.options.getBoolean("skip")) {
            await types[type](channel);
        }
        await schedule(type, channel);
    } else if (sub == "destroy") {
        await delete_event(channel.id, type);
    }
}

const types = {
    trivia: 0,
};

const scheduled = new Map();
