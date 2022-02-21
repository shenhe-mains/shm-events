import { config } from "../config.js";
import { emojis } from "../utils.js";

export const command = {
    name: "credits",
    description: "List credits for this bot and its assets",
    type: "CHAT_INPUT",
};

export async function execute(interaction) {
    await interaction.reply({
        embeds: [
            {
                title: "Credits",
                fields: [
                    {
                        name: "**⊢ Ideas ⊣**",
                        value: "Event ideas and the currency system are largely created and organized by our server's event team; as well as some help from all other staff members.",
                    },
                    {
                        name: "**⊢ Art ⊣**",
                        value: `<@841043590893404210> - ${emojis.coin}`,
                    },
                ],
                color: config.color,
            },
        ],
    });
}
