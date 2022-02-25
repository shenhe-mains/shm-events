import { add_autoreject, remove_autoreject } from "../db.js";
import { challenge_types } from "./challenge.js";

const types = {
    name: "type",
    description: "the type of challenge to automatically respond to",
    type: "STRING",
    choices: challenge_types.map(([x]) => ({ name: x, value: x })),
};

export const command = {
    name: "autoreject",
    description: "Set up an automatic decline for challenges.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "set",
            description: "Automatically decline all challenges of this type.",
            type: "SUB_COMMAND",
            options: types,
        },
        {
            name: "remove",
            description:
                "Remove your automatic challenge response and get pinged for challenges instead.",
            type: "SUB_COMMAND",
            options: types,
        },
    ],
};

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const type = interaction.options.getString("type");
    if (sub == "set") {
        await add_autoreject(interaction.user.id, type, false);
        return `If you receive a \`${type}\` challenge, it will automatically be rejected and you will not be notified.`;
    } else if (sub == "remove") {
        await remove_autoreject(interaction.user.id, type);
        return `If you receive a \`${type}\` challenge, you will be notified and can choose to accept or decline it.`;
    }
}
