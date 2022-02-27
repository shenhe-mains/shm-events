import { add_money, get_money, is_autorejecting } from "../db.js";
import { emojis, english_join, shuffle } from "../utils.js";

const options = [1, 2, 3, 4].map((n) => ({
    name: `player${n}`,
    description: `player #${n}`,
    type: "USER",
    required: n == 1,
}));

options.splice(1, 0, {
    name: "bet",
    description: "the amount all players will bet",
    type: "INTEGER",
    required: true,
});

export const command = {
    name: "blackjack",
    description: "Start a Blackjack game with up to 4 other players.",
    type: "CHAT_INPUT",
    options: options,
};

export async function execute(interaction) {
    if (interaction.channel.id == "805458033471782980") {
        return "Please use this command in <#805458034251530262>.";
    }
    const amount = interaction.options.getInteger("bet");
    if (amount > 0 && (await get_money(interaction.user.id)) < amount) {
        return "You do not have enough money for that.";
    }
    const players = [];
    for (var n = 1; n <= 4; ++n) {
        const player = interaction.options.getMember(`player${n}`, n == 1);

        if (player) {
            if (player.user.bot) {
                return "You cannot challenge bots.";
            } else if (player.id == interaction.user.id) {
                return "You cannot challenge yourself.";
            } else if (players.some((user) => user.id == player.id)) {
                return "You have listed the same user twice.";
            } else if (await is_autorejecting(player.id, "blackjack")) {
                return `${player} is not accepting blackjack challenges.`;
            } else if (amount > 0 && (await get_money(player.id)) < amount) {
                return `${player} does not have enough money for that.`;
            } else {
                players.push(player);
            }
        }
    }
    const message = await interaction.reply({
        content: players.map((player) => player.toString()).join(" "),
        embeds: [
            {
                title: `${interaction.user.tag} is creating a blackjack challenge!`,
                description: `${players.length} player${
                    players.length == 1 ? " is" : "s are"
                } being challenged to a game of blackjack. Each player will bet ${amount} ${
                    emojis.coin
                } and the winner will take all ${
                    amount * (players.length + 1)
                } ${
                    emojis.coin
                }. This challenge is only active for 5 minutes after the last player interaction. All players must accept.`,
                color: "ff0088",
            },
        ],
        components: [
            {
                type: "ACTION_ROW",
                components: [
                    {
                        type: "BUTTON",
                        style: "SUCCESS",
                        customId: "blackjack.accept",
                        emoji: "🃏",
                        label: "ACCEPT",
                    },
                    {
                        type: "BUTTON",
                        style: "DANGER",
                        customId: "blackjack.decline",
                        label: "DECLINE",
                    },
                ],
            },
        ],
        fetchReply: true,
    });
    const waiting = new Set(players.map((player) => player.id));
    while (waiting.size > 0) {
        var response;
        try {
            response = await message.awaitMessageComponent({
                filter: (interaction) => waiting.has(interaction.user.id),
                time: 300000,
            });
            if (response.customId == "blackjack.accept") {
                if (
                    amount > 0 &&
                    (await get_money(response.user.id)) < amount
                ) {
                    await response.reply({
                        content: `You no longer have ${amount} ${emojis.coin} - you will need to get more money, or forfeit the challenge.`,
                        ephemeral: true,
                    });
                } else {
                    await response.reply({
                        content: `You have confirmed your bet of ${amount} ${emojis.coin}`,
                        ephemeral: true,
                    });
                    waiting.delete(response.user.id);
                }
            } else {
                throw 0;
            }
        } catch (error) {
            await (response
                ? response.update.bind(response)
                : message.edit.bind(message))({
                embeds: [
                    {
                        title: "Blackjack challenge canceled!",
                        description:
                            "Someone declined the challenge or it expired.",
                        color: "RED",
                    },
                ],
                components: [],
            });
            return;
        }
    }
    players.push(interaction.member);
    await message.edit({
        components: [],
    });
    if (amount > 0) {
        for (const player of players) {
            if ((await get_money(player.id)) < amount) {
                await interaction.channel.send({
                    embeds: [
                        {
                            title: "Blackjack challenge failed!",
                            description: `Someone no longer has ${amount} ${emojis.coin} so this challenge cannot be started.`,
                            color: "RED",
                        },
                    ],
                });
                return;
            }
        }
    }
    for (const player of players) {
        await add_money(player.id, -amount);
    }
    const pot = amount * players.length;
    await interaction.channel.send({
        embeds: [
            {
                title: "Blackjack challenge started!",
                description: `All players have committed ${amount} ${emojis.coin} - these will be returned if the challenge expires or fails.`,
                color: "GREEN",
            },
        ],
    });
    try {
        const cards = ["♥", "♦", "♣", "♠"]
            .map((suit) =>
                [
                    ["A", 0],
                    ["2", 2],
                    ["3", 3],
                    ["4", 4],
                    ["5", 5],
                    ["6", 6],
                    ["7", 7],
                    ["8", 8],
                    ["9", 9],
                    ["10", 10],
                    ["J", 10],
                    ["Q", 10],
                    ["K", 10],
                ].map(([name, value]) => [name + suit, value])
            )
            .flat();
        const draw = () =>
            cards.splice(Math.floor(Math.random() * cards.length), 1)[0];
        const hands = players.map((player) => [player, [draw(), draw()]]);
        shuffle(hands);
        var skip;
        while (hands.length > 1) {
            const [[player, hand]] = hands.splice(0, 1);
            if (player.id == skip) {
                hands.push([player, hand]);
                break;
            }
            const total = hand_total(hand);
            const prompt = await interaction.channel.send({
                content: player.toString(),
                embeds: [
                    {
                        title: "Your turn.",
                        description:
                            "Click below to see your hand and decide on the action to take.",
                        color: "BLUE",
                    },
                ],
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            {
                                type: "BUTTON",
                                style: "SECONDARY",
                                customId: "blackjack.view",
                                label: "VIEW",
                            },
                        ],
                    },
                ],
                ephemeral: true,
                fetchReply: true,
            });
            const view_response = await prompt.awaitMessageComponent({
                filter: (interaction) => interaction.user.id == player.id,
                time: 300000,
            });
            const view_reply = await view_response.reply({
                embeds: [
                    {
                        title: "Your Hand",
                        description: `${hand
                            .map(([name, value]) => name)
                            .join(", ")} (total ${total}) - ${
                            total >= 21
                                ? "you must stand (keep your hand)."
                                : "you can hit (take another card) or stand (keep your hand)."
                        }`,
                        color: "ff0088",
                    },
                ],
                components:
                    total >= 21
                        ? []
                        : [
                              {
                                  type: "ACTION_ROW",
                                  components: [
                                      {
                                          type: "BUTTON",
                                          style: "PRIMARY",
                                          customId: "blackjack.hit",
                                          label: "HIT",
                                      },
                                      {
                                          type: "BUTTON",
                                          style: "SECONDARY",
                                          customId: "blackjack.stand",
                                          label: "STAND",
                                      },
                                  ],
                              },
                          ],
                ephemeral: true,
                fetchReply: true,
            });
            var id, last;
            if (total >= 21) {
                id = "blackjack.stand";
            } else {
                id = (last = await view_reply.awaitMessageComponent({
                    filter: (interaction) => interaction.user.id == player.id,
                    time: 300000,
                })).customId;
            }
            var new_total = total;
            if (id == "blackjack.hit") {
                skip = undefined;
                const card = draw();
                hand.push(card);
                new_total = hand_total(hand);
                await last.reply({
                    embeds: [
                        {
                            title:
                                new_total < 21
                                    ? "Card Dealt"
                                    : new_total > 21
                                    ? "Bust!"
                                    : "21 Achieved!",
                            description:
                                new_total < 21
                                    ? `You received ${card[0]} and your total is now ${new_total}.`
                                    : new_total > 21
                                    ? `You received ${card[0]} which put your total to ${new_total} > 21 - you are out of the game now.`
                                    : `You received ${card[0]}, and your total is exactly 21 now!`,
                            color:
                                new_total < 21
                                    ? "GOLD"
                                    : new_total > 21
                                    ? "RED"
                                    : "GREEN",
                        },
                    ],
                    ephemeral: new_total <= 21,
                });
            } else {
                skip ||= player.id;
                if (last) {
                    await last.reply({
                        content: "Okay, your hand remains the same.",
                        ephemeral: true,
                    });
                }
                if (total > 21) {
                    await interaction.channel.send({
                        embeds: [
                            {
                                title: "Instant Bust!",
                                description: `${player} received a score of over 21 from the first draw and was instantly eliminated!`,
                                color: "RED",
                            },
                        ],
                    });
                }
            }
            if (new_total <= 21) {
                hands.push([player, hand]);
            }
        }
        var winners = [];
        var victory = 0;
        for (const hand of hands) {
            const total = hand_total(hand[1]);
            hand.push(total);
            if (total > victory) {
                victory = total;
                winners = [hand[0]];
            } else if (total == victory) {
                winners.push(hand[0]);
            }
        }
        const reward = Math.floor(pot / winners.length);
        await interaction.channel.send({
            embeds: [
                {
                    title: "Blackjack game complete!",
                    description: `${hands
                        .map(
                            ([player, hand, total]) =>
                                `${player} had ${hand
                                    .map(([name, value]) => name)
                                    .join(", ")} totalling ${total}`
                        )
                        .join("\n")}\n\n${english_join(
                        winners.map((player) => player.toString())
                    )} ${
                        winners.length == 1 ? "was" : "were"
                    } awarded ${reward} ${emojis.coin}${
                        winners.length == 1 ? "" : " each"
                    }!`,
                    color: "AQUA",
                },
            ],
        });
        for (const winner of winners) {
            await add_money(winner.id, reward);
        }
    } catch {
        await interaction.channel.send({
            embeds: [
                {
                    title: "Blackjack challenge ended.",
                    description:
                        "Either the interaction timed out after 5 minutes, or an unexpected error occurred. All bets have been refunded.",
                    color: "RED",
                },
            ],
        });
        for (const player of players) {
            await add_money(player.id, amount);
        }
    }
}

function hand_total(hand) {
    var total = 0;
    for (const [name, value] of hand) {
        if (value == 0) {
            total += total <= 10 ? 11 : 1;
        } else {
            total += value;
        }
    }
    return total;
}
