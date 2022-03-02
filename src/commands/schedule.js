import { client } from "../client.js";
import {
    add_event,
    add_money,
    delete_event,
    delete_question,
    get_events,
    list_answers,
    list_questions,
    post_event,
    reset_economy_changes,
} from "../db.js";
import { display_time, emojis } from "../utils.js";
import { add_xp } from "../events/messageCreate.js";
import { config } from "../config.js";
import { post_changes } from "./changes.js";

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
                    name: "activity_scaling",
                    description:
                        "the number of seconds to take off the delay each time a message is sent in that channel",
                    type: "INTEGER",
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
        {
            name: "list",
            description: "List ongoing events",
            type: "SUB_COMMAND",
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
    if (sub != "list" && !types[type]) return "That event type does not exist.";
    if (sub == "create") {
        if (scheduled.has(channel.id) && scheduled.get(channel.id).has(type)) {
            return `The event \`${type}\` is already scheduled in this channel.`;
        }
        const min = interaction.options.getInteger("min");
        const max = interaction.options.getInteger("max");
        const activity_scaling =
            interaction.options.getInteger("activity_scaling") || 0;
        await add_event(channel.id, type, min, max, activity_scaling);
        await post_event(channel.id, type);
        if (!interaction.options.getBoolean("skip")) {
            types[type](channel);
        }
        schedule(type, channel, min, max, activity_scaling);
        return "Created!";
    } else if (sub == "delete") {
        await delete_event(channel.id, type);
        if (scheduled.has(channel.id)) {
            scheduled.get(channel.id).delete(type);
        }
        return "Deleted!";
    } else if (sub == "single") {
        const delay = interaction.options.getInteger("delay") || 0;
        setTimeout(() => types[type](channel), delay * 1000);
        return "Posted!";
    } else if (sub == "list") {
        const blocks = [];
        for (const [channel_id, group] of scheduled) {
            const block = [];
            for (const [type, item] of group) {
                block.push(
                    `\`${type}\`: cooldown (s) [${item.min}, ${
                        item.max
                    }], activity scaling ${
                        item.activity_scaling
                    } - next ${display_time(item.date)}`
                );
            }
            if (block.length > 0) {
                blocks.push(`<#${channel_id}>\n${block.join("\n")}`);
            }
        }
        return blocks.join("\n\n") || "(none)";
    }
}

const types = {
    trivia: async (channel) => {
        const questions = await list_questions();
        const { id, question, image } =
            questions[Math.floor(Math.random() * questions.length)];
        const answers = await list_answers(id);
        await delete_question(id);
        const xp = Math.floor(Math.random() * 20 + 80);
        const cash = Math.floor(Math.random() * 200 + 400);
        await channel.send({
            embeds: [
                {
                    title: "Trivia Question!",
                    description: `${question}\n\nYou will receive ${xp} XP for your team + ${cash} ${emojis.coin} (2 minutes to answer).`,
                    color: "ff0088",
                    image: image ? { url: image } : null,
                },
            ],
        });
        await channel.setRateLimitPerUser(10, "trivia question anti-spam");
        try {
            const messages = await channel.awaitMessages({
                filter: (message) =>
                    message.channel.id == channel.id &&
                    !message.webhookId &&
                    !message.author.bot &&
                    !message.member.roles.cache.has("838116854866116608") &&
                    answers.indexOf(message.content.toLowerCase()) != -1,
                max: 1,
                time: 120000,
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
            await channel.send({
                embeds: [
                    {
                        title: "Trivia Expired",
                        description:
                            "The trivia question expired (or attempting to reward the winner failed). The correct answers were:\n\n" +
                            answers.map((answer) => `- ${answer}`).join("\n"),
                        color: "RED",
                    },
                ],
            });
        }
        await channel.setRateLimitPerUser(0, "trivia question over");
    },
    daily_update: async (channel) => {
        await channel.send(await post_changes());
        await reset_economy_changes();
    },
    test: async (channel) => {
        await channel.send("test");
    },
};

export const scheduled = new Map();

function schedule(type, channel, min, max, activity_scaling, initial) {
    if (!scheduled.has(channel.id)) {
        scheduled.set(channel.id, new Map());
    }
    const now = new Date();
    now.setSeconds(
        now.getSeconds() + Math.random() * (max - min) + min - (initial ?? 0)
    );
    scheduled
        .get(channel.id)
        .set(type, { min, max, activity_scaling, channel, date: now });
}

var last = new Date();

setInterval(() => {
    const now = new Date();
    for (const [channel_id, group] of scheduled) {
        for (const [type, item] of group) {
            if (now >= item.date) {
                post_event(channel_id, type);
                types[type](item.channel);
                item.date.setSeconds(
                    item.date.getSeconds() +
                        Math.random() * (item.max - item.min) +
                        item.min
                );
            }
        }
    }
    if (now.getDate() != last.getDate()) {
        client.channels.fetch("946843963132870686").then(types.daily_update);
        last = now;
    }
}, 1000);

get_events().then((entries) =>
    entries.forEach(async (entry) => {
        try {
            schedule(
                entry.type,
                await client.channels.fetch(entry.channel_id),
                entry.min_period,
                entry.max_period,
                entry.activity_scaling,
                (new Date() - entry.last) / 1000
            );
        } catch (error) {
            console.error(error);
        }
    })
);
