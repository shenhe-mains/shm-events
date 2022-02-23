import { Role } from "discord.js";
import { config } from "../config.js";
import { add_money, get_user_xp } from "../db.js";
import { emojis } from "../utils.js";

export const command = {
    name: "banker",
    description: "Administrator banking commands.",
    type: "TEXT_INPUT",
    options: [
        {
            name: "deploy",
            description:
                "Give a user or role money from the bank, which is not deducted from you.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "recipient",
                    description: "the user/role to pay",
                    type: "MENTIONABLE",
                    required: true,
                },
                {
                    name: "amount",
                    description: "the amount to deploy",
                    type: "INTEGER",
                    minValue: 1,
                    required: true,
                },
            ],
        },
        {
            name: "fine",
            description:
                "Fine a user, which is returned to the bank and not given to anyone.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "target",
                    description: "the user to fine",
                    type: "USER",
                    required: true,
                },
                {
                    name: "amount",
                    description: "the amount to deduct",
                    type: "INTEGER",
                    minValue: 1,
                    required: true,
                },
            ],
        },
        {
            name: "xpreward",
            description: "Reward a user or role based on individual user XP.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "recipient",
                    description: "the user/role to pay",
                    type: "MENTIONABLE",
                    required: true,
                },
                {
                    name: "amount_per_xp",
                    description: "the amount to grant per XP point",
                    type: "NUMBER",
                    minValue: 0,
                    required: true,
                },
            ],
        },
    ],
};

export async function execute(interaction) {
    if (config.owners.indexOf(interaction.user.id) == -1) {
        return "Only bot owners can use banker commands.";
    }
    const recipient = interaction.options.getMentionable("recipient");
    const target = interaction.options.getMember("target");
    const amount = interaction.options.getInteger("amount");
    const amount_per_xp = interaction.options.getNumber("amount_per_xp");
    switch (interaction.options.getSubcommand()) {
        case "deploy":
            await interaction.deferReply();
            for (const member of recipient instanceof Role
                ? recipient.members.toJSON()
                : [recipient]) {
                await add_money(member.id, amount);
            }
            await interaction.editReply({
                embeds: [
                    {
                        title: "Deployment complete!",
                        description: `The bank paid ${recipient} ${amount} ${emojis.coin}`,
                        color: "GREEN",
                    },
                ],
            });
            break;
        case "fine":
            await add_money(target.id, -amount);
            await interaction.reply({
                embeds: [
                    {
                        title: "User fined!",
                        description: `${target} was fined ${amount} ${emojis.coin}`,
                        color: "GREEN",
                    },
                ],
            });
            break;
        case "xpreward":
            await interaction.deferReply();
            var xp_payout = 0;
            var members = 0;
            for (const member of recipient instanceof Role
                ? recipient.members.toJSON()
                : [recipient]) {
                const amount = Math.floor(
                    amount_per_xp * (await get_user_xp(member.id))
                );
                if (amount > 0) {
                    xp_payout += amount;
                    ++members;
                    await add_money(member.id, amount);
                }
            }
            await interaction.editReply({
                embeds: [
                    {
                        title: "Reward complete!",
                        description: `The bank paid ${recipient} a total of ${xp_payout} ${
                            emojis.coin
                        } to ${members} user${members == 1 ? "" : "s"}`,
                        color: "GREEN",
                    },
                ],
            });
            break;
    }
}
