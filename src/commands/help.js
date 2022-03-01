export const command = {
    name: "help",
    description: "Get help about something.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "item",
            description: "what to get help on (leave blank for global help)",
            type: "STRING",
            choices: ["blackjack"].map((x) => ({ name: x, value: x })),
        },
    ],
};

export async function execute(interaction) {
    const item = interaction.options.getString("item");
    await interaction.reply({
        embeds: [item ? helptext[item] : all],
    });
}

const all = {
    title: "Bot Help",
    description:
        "This is a list of public commands for the auxilliary features like event and bot functionalities. The core bot is probably `#help`.\n\n" +
        "`/account` - view how much money you or another user has\n" +
        "`/salary` - get your daily salary (resets daily at midnight UTC)\n" +
        "`/pay` - pay another member some money\n" +
        "`/economy` - view the richest users on the server (accepts a page argument)\n" +
        "`/leaderboard` - view each team's XP for the current event if applicable\n" +
        "`/blackjack` - play a game of blackjack against the help (`/help blackjack` for information)\n" +
        "`/challenge rps` - play a game of rock-paper-scissors against another user (you can bet money on it or play for free)\n" +
        "`/challenge fight` - do a random fight against another user (50/50 for either person to win; you can bet or play for free)\n" +
        "`/autoreject` - block challenges so other players cannot challenge you and you will not be pinged for it\n" +
        "`/buy` - buy something - currently, you can buy war efforts (XP for the event if applicable) or lottery tickets ($100 per ticket, 20% chance to double, 5% chance to quintuple, maximum 5 per purchase, one purchase per hour)",
    color: "ORANGE",
};

const helptext = {
    blackjack: {
        title: "Blackjack",
        description:
            "Blackjack is a card game played against the house. To play, run `/blackjack <amount to bet>`. The objective is for your hand's total to beat the dealer's hand's total without exceeding 21. Initially, you and the dealer will each receive two cards. One of the dealer's cards will be revealed, and you see both of your cards.\n\n" +
            "If either side gets a blackjack (Ace of Spades + Black Jack (Spades or Clubs)), they immediately win. If both sides get 21, they tie. If both sides bust (go over 21), they tie. If one side gets 21 but not the other, they win. If one side busts but not the other, they lose. Otherwise, you will be able to start taking actions.\n\n" +
            "Each action you take can be one of HIT (draw another card), DOUBLE (pay your current bet again and draw another card), FORFEIT (return half of your current bet back and lose), or STAND (keep your hand and move on to the next phase). If your total reaches 21, you are forced to STAND. If you go over 21, you lose. If you idle for more than 5 minutes, you automatically FORFEIT.\n\n" +
            "Finally, the dealer will keep drawing cards until their total reaches 17 or higher. If the dealer goes bust, you win. Otherwise, whoever has a higher value wins. If you and the dealer have the same value, you draw.\n\n" +
            "If you win, you get back your current bet + 50% of it. If you get a blackjack, you get back 3 times your bet. If you lose, you lose everything. If you draw, you get back just your bet.\n\n" +
            "Number cards are worth their value. Face cards (J, Q, K) are all worth 10. The Ace is worth 11, unless that would cause you to bust, in which case it is worth 1.",
        color: "ORANGE",
    },
};
