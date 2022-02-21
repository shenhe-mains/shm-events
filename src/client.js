import { Client, Intents } from "discord.js";

export const client = new Client({
    intents: new Intents(32767),
});
