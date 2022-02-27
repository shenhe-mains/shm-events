export const emojis = {
    coin: "<:exorcium:947302445594316800>",
};

export class Response extends Error {
    constructor(response) {
        this.response = response;
    }
}

export async function ac_substring(interaction, list, map) {
    const query = interaction.options.getFocused().toLowerCase();
    await interaction.respond(
        list
            .filter((item) => item.toLowerCase().indexOf(query) > -1)
            .map((item) =>
                item.length > 100 ? item.substring(0, 97) + "..." : item
            )
            .map((item) => ({ name: item, value: map ? map.get(item) : item }))
            .slice(0, 25)
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
                await interaction.editReply({
                    content: "Confirmed!",
                    embeds: [],
                    components: [],
                });
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

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
