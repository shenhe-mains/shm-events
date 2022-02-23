import fs from "fs";
import path from "path";
import { add_money, buy, get_money, last_purchase, shop_owned } from "../db.js";
import { ac_substring, display_time, emojis } from "../utils.js";

const names = [];
const items = new Map();

const shopdir = path.join(process.cwd(), "src", "shop", "items");
for (const file of fs.readdirSync(shopdir)) {
    import(path.join(shopdir, file)).then((item) => {
        names.push(item.name);
        items.set(item.name, item);
    });
}

export const command = {
    name: "buy",
    description: "Buy something from the shop.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "item",
            description: "what you are buying",
            type: "STRING",
            required: true,
            autocomplete: true,
        },
        {
            name: "amount",
            description: "how many to buy (default 1)",
            type: "INTEGER",
            minValue: 1,
        },
    ],
};

export async function execute(interaction) {
    const item = items.get(interaction.options.getString("item"));
    if (!item) {
        return "There is no item by that name.";
    }
    const amount = interaction.options.getInteger("amount") || 1;
    if (item.max_bulk > 0) {
        if (amount > item.max_bulk) {
            return `You can only buy up to ${item.max_bulk} at once.`;
        }
    }
    if (item.max > 0) {
        const owned = await shop_owned(item.name, interaction.user.id);
        if (owned + amount > item.max) {
            return `You can only have ${item.max}, and you already own ${owned}.`;
        }
    }
    const cash = await get_money(interaction.user.id);
    if (cash < item.cost * amount) {
        return `You must have at least ${item.cost * amount} ${
            emojis.coin
        } (you only have ${cash} ${emojis.coin})`;
    }
    const last = await last_purchase(item.name, interaction.user.id);
    const now = new Date();
    if (last !== undefined && new Date() - last < item.cooldown * 1000) {
        now.setSeconds(now.getSeconds() + item.cooldown);
        return `You can buy again ${display_time(now)}.`;
    }
    await add_money(interaction.user.id, -item.cost * amount);
    if (!(await item.validate(interaction, amount))) {
        return;
    }
    await item.buy(interaction, amount);
    await buy(item.name, interaction.user.id, amount);
}

export async function autocomplete(interaction) {
    await ac_substring(interaction, names);
}
