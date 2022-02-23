import { config } from "../config.js";
import { add_money, get_money } from "../db.js";
import { emojis } from "../utils.js";

const opponent = {
    name: "opponent",
    description: "the user to challenge",
    type: "USER",
    required: true,
};

const amount = {
    name: "amount",
    description: "the amount to wager",
    type: "INTEGER",
    required: true,
    minValue: 1,
};

export const command = {
    name: "challenge",
    description: "Challenge a player to a minigame.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "fight",
            description: "Do a randomized 1v1 against another player.",
            type: "SUB_COMMAND",
            options: [opponent, amount],
        },
    ],
};

export async function execute(interaction) {
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
    if ((await get_money(interaction.user.id)) < amount) {
        return "You do not have enough money for that.";
    }
    if ((await get_money(opponent.id)) < amount) {
        return "Your opponent does not have enough money for that.";
    }
    var win;
    var cancel = false;
    var message;
    switch (interaction.getSubcommand()) {
        case "fight":
            message = await interaction.reply({
                embeds: [
                    {
                        title: "Fight Challenge",
                        description: `${interaction.user} has challenged ${opponent} to a (random) fight for ${amount} ${emojis.coin}! They have 60 seconds to accept.`,
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
                                emoji: "🤝",
                                label: "FIGHT!",
                            },
                            {
                                type: "BUTTON",
                                style: "DANGER",
                                customId: "cancel",
                                emoji: "✋",
                                label: "PASS",
                            },
                        ],
                    },
                ],
                fetchReply: true,
            });
            try {
                const response = await message.awaitMessageComponent({
                    filter: (interaction) => interaction.user.id == opponent.id,
                    time: 60000,
                });
                if (response.customId == "confirm") {
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
                } else {
                    cancel = true;
                }
            } catch {
                cancel = true;
            }
            break;
    }
    if (cancel) {
        await interaction.editReply({
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
        const giver = win ? opponent : interaction.user;
        const receiver = win ? interaction.user : opponent;
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

const fight_actions = [
    [(x, y) => `${x} kicked ${y}`, 10, 25],
    [(x, y) => `${x} punched ${y}`, 10, 20],
    [(x, y) => `${x} threw a leaf at ${y}`, 0, 0],
    [(x, y) => `${x} ran over ${y}`, 40, 60],
    [(x, y) => `${x} shot ${y}`, 50, 75],
    [(x, y) => `${x} used THE MIGHT OF ZEUS on ${y}`, 100, 100],
    [(x, y) => `${x} tried to shoot ${y}, but missed`, 0, 0],
    [
        (x, y) =>
            `${x} used [EMOTIONAL DAMAGE](https://www.youtube.com/watch?v=i1ojUmdF42U) on ${y}`,
        [20, 40],
    ],
    [
        (x, y) =>
            `${x} couldn't bring themselves to hurt ${y}, and healed them`,
        [-20, -10],
    ],
    [(x, y) => `${x} summoned Shenhe's spirit to their aid`, [40, 80]],
    [(x, y) => `${x} smited ${y}`, [20, 60]],
    [(x, y) => `${x} rolled the dice of ${y}'s fate`, [0, 100]],
];

function do_fight(user_1, user_2) {
    const users = (
        Math.random() < 0.5 ? [user_1, user_2] : [user_2, user_1]
    ).map((user) => ({ user, hp: 100 }));
    const actions = [];
    while (true) {
        const [msgfn, min, max] =
            fight_actions[Math.floor(Math.random() * fight_actions.length)];
        const damage = Math.floor(Math.random() * (max - min)) + min;
        const message = msgfn(users[0].user, users[1].user);
        users[1].hp -= damage;
        if (users[1].hp <= 0) {
            actions.push(`${message}, knocking them out.`);
            actions.push(`${users[0].user} wins!`);
            break;
        } else {
            actions.push(
                `${message} for ${damage} damage; ${users[1].user} is on ${users[1].hp} HP.`
            );
        }
    }
    return [users[0], actions.join("\n")];
}