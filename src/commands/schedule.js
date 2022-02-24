import { client } from "../client.js";
import {
    add_event,
    add_money,
    delete_event,
    delete_question,
    get_event,
    get_events,
    list_answers,
    list_questions,
    post_event,
} from "../db.js";
import { emojis } from "../utils.js";
import { add_xp } from "../events/messageCreate.js";
import { config } from "../config.js";

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
        {
            name: "test",
            value: "test",
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
        {
            name: "single",
            description: "Trigger an event once.",
            type: "SUB_COMMAND",
            options: [
                type,
                channel,
                {
                    name: "delay",
                    description: "the delay (seconds)",
                    type: "INTEGER",
                    minValue: 0,
                },
            ],
        },
    ],
};

export async function execute(interaction) {
    if (config.owners.indexOf(interaction.user.id) == -1) {
        return "Only bot owners can use schedule commands.";
    }
    const sub = interaction.options.getSubcommand();
    const type = interaction.options.getString("type");
    const channel = interaction.options.getChannel("channel");
    if (!types[type]) return "That event type does not exist.";
    if (sub == "create") {
        await add_event(
            channel.id,
            type,
            interaction.options.getInteger("min"),
            interaction.options.getInteger("max")
        );
        await post_event(channel.id, type);
        if (!interaction.options.getBoolean("skip")) {
            types[type](channel);
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
    } else if (sub == "single") {
        const delay = interaction.options.getInteger("delay") || 0;
        setTimeout(() => types[type](channel), delay * 1000);
        return "Posted!";
    }
}

const types = {
    trivia: async (channel) => {
        const questions = await list_questions();
        const { id, question, image } =
            questions[Math.floor(Math.random() * questions.length)];
        const answers = await list_answers(id);
        await delete_question(question);
        const xp = Math.floor(Math.random() * 20 + 80);
        const cash = Math.floor(Math.random() * 200 + 400);
        await channel.send({
            embeds: [
                {
                    title: "Trivia Question!",
                    description: `${question}\n\nYou will receive ${xp} XP for your team + ${cash} ${emojis.coin} (10 minutes to answer).`,
                    color: "ff0088",
                    image: image ? { url: image } : null,
                },
            ],
        });
        try {
            const messages = await channel.awaitMessages({
                filter: (message) =>
                    message.channel.id == channel.id &&
                    !message.webhookId &&
                    !message.author.bot &&
                    !message.member.roles.cache.has("838116854866116608") &&
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
        } catch {}
    },
    test: async (channel) => {
        await channel.send("test");
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
    const delay = seconds * 1000 - (new Date() - event.last);
    scheduled.set(
        key,
        setTimeout(() => {
            post_event(channel.id, type);
            types[type](channel);
            schedule(type, channel);
        }, delay)
    );
    await (
        await client.channels.fetch("939295929121513472")
    ).send(
        `Event \`${type}\` is triggering in ${channel} in ${delay} milliseconds.`
    );
}

get_events().then((entries) =>
    entries.forEach(async (entry) => {
        try {
            await schedule(
                entry.type,
                await client.channels.fetch(entry.channel_id)
            );
        } catch (error) {
            console.error(error);
        }
    })
);
