import { config } from "../config.js";
import { add_money, get_money, is_autorejecting } from "../db.js";
import { emojis } from "../utils.js";

export const challenge_types = [
    ["fight", "Do a randomized 1v1 against another player."],
    [
        "rps",
        "Play Rock-Paper-Scissors against another player.",
        [
            {
                name: "action",
                description: "the action to take",
                type: "STRING",
                required: true,
                choices: ["rock", "paper", "scissors"].map((item) => ({
                    name: item,
                    value: item,
                })),
            },
        ],
    ],
];

export const command = {
    name: "challenge",
    description: "Challenge a player to a minigame.",
    type: "CHAT_INPUT",
    options: challenge_types.map(([name, description, options]) => ({
        name,
        description,
        type: "SUB_COMMAND",
        options: [
            {
                name: "opponent",
                description: "the user to challenge",
                type: "USER",
                required: true,
            },
            {
                name: "amount",
                description: "the amount to wager",
                type: "INTEGER",
                required: true,
                minValue: 0,
            },
            ...(options || []),
        ],
    })),
};

export async function execute(interaction) {
    if (interaction.channel.id == "805458033471782980") {
        return "Please use this command in <#805458034251530262>.";
    }
    const opponent = interaction.options.getMember("opponent", true);
    const amount = interaction.options.getInteger("amount", true);
    if (opponent.id == interaction.user.id) {
        return "You cannot challenge yourself.";
    }
    if (opponent.user.bot) {
        return "You cannot challenge a bot.";
    }
    if (!interaction.channel.permissionsFor(opponent).has("VIEW_CHANNEL")) {
        return "That user does not have access to this channel, so they would not be able to see your challenge.";
    }
    if (amount > 0) {
        if ((await get_money(interaction.user.id)) < amount) {
            return "You do not have enough money for that.";
        }
        if ((await get_money(opponent.id)) < amount) {
            return "Your opponent does not have enough money for that.";
        }
    }
    const sub = interaction.options.getSubcommand();
    if (await is_autorejecting(opponent.id, sub)) {
        return "Your opponent is not accepting that type of challenge.";
    }
    if (await is_autorejecting(interaction.user.id, sub)) {
        return "You are not allowed to declare challenges of types that you are not accepting. Use `/autoreject remove` if you wish to change this.";
    }
    var win, message, response;
    switch (sub) {
        case "fight":
            message = await interaction.reply({
                content: opponent.toString(),
                embeds: [
                    {
                        title: "Fight Challenge",
                        description: `${interaction.user} has challenged ${opponent} to a (random) fight for ${amount} ${emojis.coin} They have 60 seconds to accept.`,
                        color: "ff0088",
                    },
                ],
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "BUTTON",
                                style: "PRIMARY",
                                customId: "confirm",
                                emoji: "????",
                                label: "FIGHT!",
                            },
                            {
                                type: "BUTTON",
                                style: "DANGER",
                                customId: "cancel",
                                emoji: "???",
                                label: "PASS",
                            },
                        ],
                    },
                ],
                fetchReply: true,
            });
            break;
        case "rps":
            await interaction.respond("Posting challenge!");
            message = await interaction.channel.send({
                content: opponent.toString(),
                embeds: [
                    {
                        title: "Rock-Paper-Scissors Challenge",
                        description: `${interaction.user} has challenged ${opponent} to a game of Rock-Paper-Scissors for ${amount} ${emojis.coin} They have 60 seconds to accept.`,
                        color: "ff0088",
                    },
                ],
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "BUTTON",
                                style: "SECONDARY",
                                customId: "rock",
                                emoji: "????",
                            },
                            {
                                type: "BUTTON",
                                style: "SECONDARY",
                                customId: "paper",
                                emoji: "????",
                            },
                            {
                                type: "BUTTON",
                                style: "SECONDARY",
                                customId: "scissors",
                                emoji: "??????",
                            },
                            {
                                type: "BUTTON",
                                style: "DANGER",
                                customId: "cancel",
                                label: "DECLINE",
                            },
                        ],
                    },
                ],
            });
    }
    try {
        const click = await message.awaitMessageComponent({
            filter: (interaction) => interaction.user.id == opponent.id,
            time: 60000,
        });
        response = click.customId;
    } catch {
        response = "cancel";
    }
    if (response == "cancel") {
        await message.edit({
            embeds: [
                {
                    title: "Challenge Declined!",
                    description: `${opponent} declined ${interaction.user}'s challenge, or didn't respond in time.`,
                    color: "RED",
                },
            ],
            components: [],
        });
    } else {
        switch (sub) {
            case "fight":
                const [fight_winner, fight_text] = do_fight(
                    interaction.member,
                    opponent
                );
                await interaction.editReply({
                    embeds: [
                        {
                            title: `${fight_winner.user.tag} wins!`,
                            description: fight_text,
                            color: config.color,
                        },
                    ],
                    components: [],
                });
                win = fight_winner.id == interaction.user.id;
                break;
            case "rps":
                const rps_action = interaction.options.getString("action");
                if (rps_action == response) {
                    await message.edit({
                        embeds: [
                            {
                                title: "Tie!",
                                description: `${interaction.user} and ${opponent} both picked ${rps_action}!`,
                                color: config.color,
                            },
                        ],
                        components: [],
                    });
                    return;
                } else {
                    win =
                        (rps_action == "rock" && response == "scissors") ||
                        (rps_action == "scissors" && response == "paper") ||
                        (rps_action == "paper" && response == "rock");
                    await message.edit({
                        embeds: [
                            {
                                title: `${
                                    (win ? interaction.user : opponent.user).tag
                                } wins!`,
                                description: `${
                                    win ? rps_action : response
                                } beats ${win ? response : rps_action}!`,
                                color: config.color,
                            },
                        ],
                        components: [],
                    });
                }
                break;
        }
        const giver = win ? opponent : interaction.user;
        const receiver = win ? interaction.user : opponent;
        if (amount > 0) {
            if (
                Math.min(
                    await get_money(giver.id),
                    await get_money(receiver.id)
                ) < amount
            ) {
                await interaction.channel.send({
                    embeds: [
                        {
                            title: "Challenge Payment Failed",
                            description: `Either ${giver} or ${receiver} no longer has ${amount} ${emojis.coin}, so the challenge has been invalidated.`,
                            color: "RED",
                        },
                    ],
                });
            } else {
                await add_money(giver.id, -amount);
                await add_money(receiver.id, amount);
                await interaction.channel.send({
                    embeds: [
                        {
                            title: "Challenge Payment Complete",
                            description: `${giver} paid ${receiver} ${amount} ${emojis.coin} for the challenge.`,
                            color: config.color,
                        },
                    ],
                });
            }
        }
    }
}

const fight_actions = [
    [(x, y) => `${x} kicked ${y}`, 10, 25],
    [(x, y) => `${x} punched ${y}`, 10, 20],
    [(x, y) => `${x} threw a leaf at ${y}`, 0, 0],
    [(x, y) => `${x} ran over ${y}`, 40, 60],
    [(x, y) => `${x} shot ${y}`, 50, 75],
    [(x, y) => `${x} tried to shoot ${y}, but missed`, 0, 0],
    [
        (x, y) =>
            `${x} couldn't bring themselves to hurt ${y}, and healed them`,
        -20,
        -10,
    ],
    [(x, y) => `${x} smote ${y}`, 20, 60],
    [(x, y) => `${x} rolled the dice of ${y}'s fate`, 0, 100],
    [(x, y) => `${x} threw ${y} off of Albedo's elevator`, 30, 50],
    [(x, y) => `${x} detonated Aloy's power cell: Prophecies of Dawn`, 50, 75],
    [(x, y) => `${x} blew up Baron Bunny in ${y}'s face`, 40, 60],
    [(x, y) => `${x} threw a cow (it was Ushi) at ${y}`, 30, 50],
    [
        (x, y) =>
            `${x} [Barbara-slapped](https://www.youtube.com/watch?v=72gnO-bYmLY) ${y}`,
        15,
        30,
    ],
    [(x, y) => `${x} called the tides (Beidou's Tidecaller)`, 40, 60],
    [(x, y) => `${x} gave ${y} Bennett's luck`, 50, 100],
    [(x, y) => `${x} exorcised ${y} with their yang energy`, 60, 80],
    [(x, y) => `${x} summoned a phoenix (Diluc)`, 60, 80],
    [
        (x, y) =>
            `${x}'s Signature Mix (Diona) was so bad that it poisoned ${y}`,
        50,
        75,
    ],
    [(x, y) => `${x} struck down ${y} with their Lightfall Sword`, 60, 90],
    [(x, y) => `${x} struck ${y} with their Frostflake Arrow`, 40, 80],
    [(x, y) => `${x} rallied their army with their War Banner (Gorou)`, 20, 40],
    [(x, y) => `${x} struck ${y} with Spirit Soother (Hu Tao)`, 60, 100],
    [(x, y) => `${x} calls upon the wind's protection (Jean)`, 30, 60],
    [(x, y) => `${x} unleashed Chihayaburu (Kaedehara Kazuha)`, 25, 50],
    [(x, y) => `${x} unleashed a frigid blast (Kaeya), freezing ${y}`, 40, 60],
    [(x, y) => `${x} struck ${y} with Kamisato Art: Kabuki`, 40, 60],
    [(x, y) => `${x} unleashed the power of lightning (Keqing)`, 50, 75],
];

const rare_actions = [
    [(x, y) => `${x} used THE MIGHT OF ZEUS on ${y}`, 1000, 1000],
    [
        (x, y) =>
            `I, Fischl von Luftschloss Narfidort, Prinzessin der Verurteilung, descend upon this land by the call of fate of ${x} and bring down Thundering Retribution to strike down ${y}!`,
        1000,
        1000,
    ],
    [
        (x, y) =>
            `${x} used [EMOTIONAL DAMAGE](https://www.youtube.com/watch?v=i1ojUmdF42U) on ${y}`,
        20,
        40,
    ],
    [(x, y) => `${x} summoned Shenhe's spirit to their aid`, 40, 80],
];

function do_fight(user_1, user_2) {
    const users = (
        Math.random() < 0.5 ? [user_1, user_2] : [user_2, user_1]
    ).map((user) => ({ user, hp: 100 }));
    const actions = [];
    while (true) {
        const ls = Math.random() < 0.1 ? rare_actions : fight_actions;
        const [msgfn, min, max] = ls[Math.floor(Math.random() * ls.length)];
        const damage = Math.floor(Math.random() * (max - min)) + min;
        const message = msgfn(users[0].user, users[1].user);
        users[1].hp -= damage;
        if (users[1].hp <= 0) {
            actions.push(
                `${message} for **${damage} damage**, knocking them out.`
            );
            actions.push(`**${users[0].user} wins!**`);
            break;
        } else {
            actions.push(
                `${message} for **${damage} damage**. (${users[1].hp} HP left)`
            );
            [users[0], users[1]] = [users[1], users[0]];
        }
    }
    return [users[0].user, actions.join("\n")];
}
