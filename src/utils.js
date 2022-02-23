export const emojis = {
    coin: "<:money:945486340861083648>",
};

export class Response extends Error {
    constructor(response) {
        this.response = response;
    }
}

export async function ac_substring(interaction, list, map) {
    const query = interaction.options.getFocused();
    await interaction.respond(
        list
            .filter((item) => item.match(query))
            .map((item) => ({ name: item, value: map ? map.get(item) : item }))
    );
}

export function display_time(datetime) {
    const ts = Math.floor(datetime.getTime() / 1000);
    return `<t:${ts}> (<t:${ts}:R>)`;
}

export async function disable_buttons(message) {
    await message.edit({
        components: message.components.map(
            (row) => (
                row.components.forEach((button) => (button.disabled = true)),
                row
            )
        ),
    });
}

export function english_join(list) {
    if (list.length == 0) {
        return "<empty>";
    } else if (list.length == 1) {
        return list[0];
    } else if (list.length == 2) {
        return list.join(" and ");
    } else {
        return (
            list.slice(0, list.length - 1).join(", ") +
            ", and " +
            list[list.length - 1]
        );
    }
}

export async function confirm(interaction, embed, confirm, cancel, timeout) {
    const message = await interaction.reply({
        embeds: [embed],
        components: [
            {
                type: "ACTION_ROW",
                components: [
                    {
                        type: "BUTTON",
                        style: "SUCCESS",
                        customId: "confirm",
                        label: confirm || "CONFIRM",
                    },
                    {
                        type: "BUTTON",
                        style: "DANGER",
                        customId: "cancel",
                        label: cancel || "CANCEL",
                    },
                ],
            },
        ],
        ephemeral: true,
        fetchReply: true,
    });
    try {
        const response = await message.awaitMessageComponent({
            time: timeout || 60000,
        });
        if (response.customId == "confirm") {
            try {
                await interaction.deleteReply();
            } finally {
                return true;
            }
        }
    } catch {}
    await interaction.editReply({
        content: "Canceled!",
        embeds: [],
        components: [],
    });
}
