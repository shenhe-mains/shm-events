import { add_money, get_money } from "../db.js";
import { emojis } from "../utils.js";

export const command = {
    name: "blackjack",
    description: "Start a Blackjack game (against the house).",
    type: "CHAT_INPUT",
    options: [
        {
            name: "bet",
            description: "the amount to bet",
            type: "INTEGER",
            minValue: 0,
            required: true,
        },
    ],
};

export async function execute(interaction) {
    if (interaction.channel.id == "805458033471782980") {
        return "Please use this command in <#805458034251530262>.";
    }
    var bet = interaction.options.getInteger("bet");
    if (bet > 0 && (await get_money(interaction.user.id)) < bet) {
        return "You do not have enough money for that!";
    }
    await add_money(interaction.user.id, -bet);
    try {
        const cards = ["H", "D", "S", "C"]
            .map((suit) =>
                [
                    ["A.", 0],
                    ["2", 2],
                    ["3", 3],
                    ["4", 4],
                    ["5", 5],
                    ["6", 6],
                    ["7", 7],
                    ["8", 8],
                    ["9", 9],
                    ["10", 10],
                    ["J.", 10],
                    ["Q.", 10],
                    ["K.", 10],
                ].map(([name, value]) => ({
                    name: `\`${name}${suit}\``,
                    value,
                }))
            )
            .flat();
        const draw = () =>
            cards.splice(Math.floor(Math.random() * cards.length), 1)[0];
        const dealer = [draw(), draw()];
        const player = [draw(), draw()];
        await interaction.reply({
            embeds: [
                {
                    title: "Initial Deal",
                    description: `\`Dealer\`: ${dealer[0].name}, \`??\`\n\`Player\`: ${player[0].name}, ${player[1].name}`,
                    color: "AQUA",
                },
            ],
        });
        if (blackjack(player)) {
            await add_money(interaction.user.id, bet * 3);
            await interaction.channel.send({
                embeds: [
                    {
                        title: "Blackjack!",
                        description: `You got a blackjack (ace of spades + black jack)! You have been rewarded ${
                            bet * 3
                        } ${emojis.coin}`,
                        color: "cc00ff",
                    },
                ],
            });
        } else if (blackjack(dealer)) {
            await interaction.channel.send({
                embeds: [
                    {
                        title: "Dealer Blackjack!",
                        description: `The dealer got a blackjack (${dealer[0].name} + ${dealer[1].name})! You have lost the game.`,
                        color: "RED",
                    },
                ],
            });
        } else if (hand_total(player) == 21) {
            if (hand_total(dealer) == 21) {
                await add_money(interaction.user.id, bet);
                await interaction.channel.send({
                    embeds: [
                        {
                            title: "Draw!",
                            description: `You and the dealer (${dealer[0].name} + ${dealer[1].name}) both got 21, so the game resulted in a draw and your bet has been returned.`,
                            color: "ORANGE",
                        },
                    ],
                });
            } else {
                await add_money(interaction.user.id, Math.floor(bet * 1.5));
                await interaction.channel.send({
                    embeds: [
                        {
                            title: "Win!",
                            description: `Your starting hand was worth 21 so you immediately win ${Math.floor(
                                bet * 1.5
                            )} ${emojis.coin}`,
                            color: "GREEN",
                        },
                    ],
                });
            }
        } else if (hand_total(dealer) == 21) {
            await interaction.channel.send({
                embeds: [
                    {
                        title: "Loss!",
                        description: `The dealer's starting hand was worth 21 (${dealer[0].name} + ${dealer[1].name})! You have lost the game.`,
                        color: "RED",
                    },
                ],
            });
        } else if (hand_total(player) > 21) {
            if (hand_total(dealer) > 21) {
                await add_money(interaction.user.id, bet);
                await interaction.channel.send({
                    embeds: [
                        {
                            title: "Draw!",
                            description: `The dealer's starting hand (${dealer[0].name} + ${dealer[1].name}) and yours both went bust, so you have drawn and received your bet back.`,
                            color: "GOLD",
                        },
                    ],
                });
            } else {
                await interaction.channel.send({
                    embeds: [
                        {
                            title: "Bust!",
                            description: `Your hand went bust and the dealer's hand (${dealer[0].name} + ${dealer[1].name}) didn't, so you lost!`,
                            color: "RED",
                        },
                    ],
                });
            }
        } else {
            const embed = () => ({
                title: "Pick an action!",
                description: `Your bet is ${bet} ${
                    emojis.coin
                }. Your hand is ${player
                    .map((card) => card.name)
                    .join(" + ")} (total ${hand_total(
                    player
                )}). You can HIT (take another card), DOUBLE (double your bet and take another card), FORFEIT (surrender half your bet and receive the other half back), or STAND (keep your hand and finish the game). **If you do not choose an action within 5 minutes, you will automatically FORFEIT.**`,
                color: "AQUA",
            });
            const message = await interaction.channel.send({
                embeds: [embed()],
                components: [
                    {
                        type: "ACTION_ROW",
                        components: [
                            ["PRIMARY", "HIT"],
                            ["SUCCESS", "DOUBLE"],
                            ["DANGER", "FORFEIT"],
                            ["SECONDARY", "STAND"],
                        ].map(([style, label]) => ({
                            type: "BUTTON",
                            style,
                            customId: `blackjack.${label.toLowerCase()}`,
                            label,
                        })),
                    },
                ],
            });
            while (true) {
                var action;
                var response;
                try {
                    action = (response = await message.awaitMessageComponent({
                        filter: (response) =>
                            response.user.id == interaction.user.id,
                        time: 300000,
                    })).customId;
                } catch {
                    action = "blackjack.forfeit";
                }
                if (action == "blackjack.double") {
                    if (bet == 0) {
                        await interaction.reply({
                            content:
                                "You are currently playing for nothing so this action doesn't make sense...",
                            ephemeral: true,
                        });
                    } else if ((await get_money(interaction.user.id)) < bet) {
                        await interaction.reply({
                            content: `You do not have ${bet} ${emojis.coin}`,
                            ephemeral: true,
                        });
                    } else {
                        await add_money(interaction.user.id, -bet);
                        bet *= 2;
                    }
                }
                if (action == "blackjack.hit" || action == "blackjack.double") {
                    player.push(draw());
                    const total = hand_total(player);
                    if (total > 21) {
                        await response.update({
                            embeds: [
                                {
                                    title: "Bust!",
                                    description: `You drew a ${
                                        player[player.length - 1].name
                                    } and your total is ${total} > 21, so you have lost!`,
                                    color: "RED",
                                },
                            ],
                            components: [],
                        });
                        return;
                    } else if (total < 21) {
                        await response.update({
                            embeds: [embed()],
                        });
                    } else {
                        await response.update({
                            embeds: [
                                {
                                    title: "21!",
                                    description: `You drew a ${
                                        player[player.length - 1].name
                                    }, so your total is now 21. Proceeding to the next phase...`,
                                    color: "GREEN",
                                },
                            ],
                            components: [],
                        });
                        break;
                    }
                } else if (action == "blackjack.forfeit") {
                    await add_money(interaction.user.id, Math.floor(bet / 2));
                    await (response
                        ? response.update.bind(response)
                        : message.edit.bind(message))({
                        embeds: [
                            {
                                title: "Forfeited!",
                                description: `You forfeited and received ${Math.floor(
                                    bet / 2
                                )} ${emojis.coin} back!`,
                                color: "ORANGE",
                            },
                        ],
                        components: [],
                    });
                } else if (action == "blackjack.stand") {
                    await response.update({
                        embeds: [
                            {
                                title: "Standing!",
                                description: "Proceeding to the next phase...",
                                color: "GREEN",
                            },
                        ],
                        components: [],
                    });
                    break;
                }
            }
            while (hand_total(dealer) < 17) {
                dealer.push(draw());
            }
            const dt = hand_total(dealer);
            const pt = hand_total(player);
            const win = dt > 21 || pt > dt;
            if (pt == dt) {
                await add_money(interaction.user.id, bet);
            } else if (win) {
                await add_money(interaction.user.id, Math.floor(bet * 1.5));
            }
            await interaction.channel.send({
                embeds: [
                    {
                        title: pt == dt ? "Draw!" : win ? "Win!" : "Loss!",
                        description: `\`Dealer\`: ${dealer
                            .map((card) => card.name)
                            .join(" + ")} (${dt})\n\`Player\`: ${player
                            .map((card) => card.name)
                            .join(" + ")} (${pt})\n\n${
                            pt == dt
                                ? `You drew and will receive all ${bet} ${emojis.coin} back.`
                                : win
                                ? `You won and will receive ${Math.floor(
                                      bet * 1.5
                                  )} ${emojis.coin}`
                                : `You lost!`
                        }`,
                        color: pt == dt ? "GOLD" : win ? "GREEN" : "RED",
                    },
                ],
            });
        }
    } catch (error) {
        console.error(error);
        await add_money(interaction.user.id, bet);
        await interaction.channel.send({
            embeds: [
                {
                    title: "Challenge failed!",
                    description:
                        "An unexpected error occurred. Your bet has been returned.",
                    color: "RED",
                },
            ],
        });
    }
}

function blackjack(hand) {
    return (
        hand.some((card) => card.name == "A.S") &&
        hand.some((card) => card.name == "J.S" || card.name == "J.C")
    );
}

function hand_total(hand) {
    var total = 0;
    for (const card of hand) {
        if (card.value != 0) {
            total += card.value;
        }
    }
    for (const card of hand) {
        if (card.value == 0) {
            total += total <= 10 ? 11 : 1;
        }
    }
    return total;
}
