import { client } from "../client.js";
import {
    add_event,
    add_money,
    delete_event,
    get_event,
    get_events,
    post_event,
} from "../db.js";
import { emojis } from "../utils.js";
import { add_xp } from "../events/messageCreate.js";

export const type = {
    name: "type",
    description: "the type of event",
    type: "STRING",
    required: true,
    choices: [
        {
            name: "trivia",
            value: "trivia",
        },
    ],
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
                    description: "minimum delay (seconds)",
                    type: "INTEGER",
                    minValue: 1,
                    required: true,
                },
                {
                    name: "max",
                    description: "maximum delay (seconds)",
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
        return "Created!";
    } else if (sub == "delete") {
        await delete_event(channel.id, type);
        const key = channel.id + "/" + type;
        if (scheduled.has(key)) {
            try {
                clearTimeout(scheduled.get(key));
            } catch {}
        }
        return "Deleted!";
    }
}

const types = {
    trivia: async (channel) => {
        const [question, answers] =
            trivia_questions[
                Math.floor(Math.random() * trivia_questions.length)
            ];
        const xp = Math.floor(Math.random() * 10 + 45);
        const cash = Math.floor(Math.random() * 100 + 300);
        await channel.send({
            embeds: [
                {
                    title: "Trivia Question!",
                    description: `${question}\n\nYou will receive ${xp} XP for your team + ${cash} ${emojis.coin} (10 minutes to answer).`,
                    color: "ff0088",
                },
            ],
        });
        try {
            const messages = await channel.awaitMessages({
                filter: (message) =>
                    answers.indexOf(message.content.toLowerCase()) != -1,
                max: 1,
                time: 600000,
                errors: ["time"],
            });
            const message = messages.first();
            await add_xp(message.member, xp, true);
            await add_money(message.author.id, cash);
            await message.reply({
                embeds: [
                    {
                        title: "Congratulations!",
                        description: `You have won ${xp} XP and ${cash} ${emojis.coin}`,
                        color: "GREEN",
                    },
                ],
            });
        } catch (error) {
            console.error(error);
        }
    },
};

const scheduled = new Map();

async function schedule(type, channel) {
    const event = await get_event(channel.id, type);
    if (!event) return;
    const seconds =
        Math.random() * (event.max_period - event.min_period) +
        event.min_period;
    const key = channel.id + "/" + type;
    if (scheduled.has(key)) {
        try {
            clearTimeout(scheduled.get(key));
        } catch {}
    }
    scheduled.set(
        key,
        setTimeout(() => {
            types[type](channel);
            schedule(type, channel);
        }, seconds * 1000)
    );
}

get_events().then((entries) =>
    entries.forEach(async (entry) => {
        try {
            await schedule(
                entry.type,
                await client.channels.fetch(entry.channel_id)
            );
        } catch {}
    })
);

const trivia_questions = [
    ["Which element is Shenhe?", ["cryo"]],
    [
        "Which two elements form the MELT reaction (separate by space)?",
        ["cryo pyro", "pyro cryo"],
    ],
    [
        "Which two elements form the FREEZE reaction (separate by space)?",
        ["cryo hydro", "hydro cryo"],
    ],
    [
        "Which element (for which there are playable characters) CANNOT be swirled (except anemo)?",
        ["geo"],
    ],
    [
        "Which element does Tartaglia (boss)'s first phase have bonus resistance against?",
        ["hydro"],
    ],
];
