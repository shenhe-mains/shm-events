import path from "path";
import fs from "fs";

import { client } from "./client.js";
import { config } from "./config.js";
import { db } from "./db_client.js";
import { Response } from "./utils.js";

process.on("uncaughtException", (error) => {
    console.error("UNEXPECTED UNCAUGHT EXCEPTION");
    console.error("=============================");
    console.error(error);
});

const commands = new Map();
const autocompletes = new Map();
var interaction_listener;

client.on("ready", async () => {
    await db.connect();

    console.log("Loading commands...");

    const commanddir = path.join(process.cwd(), "src", "commands");
    const guild = await client.guilds.fetch(config.guild_id);
    for (const file of fs.readdirSync(commanddir)) {
        const { command, execute, autocomplete } = await import(
            path.join(commanddir, file)
        );
        await guild.commands.create(command);
        commands.set(command.name, execute);
        if (autocomplete) autocompletes.set(command.name, autocomplete);
    }

    const eventdir = path.join(process.cwd(), "src", "events");
    for (const file of fs.readdirSync(eventdir)) {
        const { handle } = await import(path.join(eventdir, file));
        if (file == "interactionCreate.js") {
            interaction_listener = handle;
        } else {
            client.on(file.substring(0, file.length - 3), handle);
        }
    }

    console.log("SHM event bot is ready.");
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isAutocomplete()) {
        interaction.respond = (message) =>
            interaction.reply({
                content: message,
                allowedMentions: { parse: [] },
                ephemeral: true,
            });
    }

    if (interaction.isCommand()) {
        if (commands.has(interaction.commandName)) {
            try {
                const response = await commands.get(interaction.commandName)(
                    interaction
                );
                if (response) await interaction.respond(response);
            } catch (error) {
                try {
                    await interaction.respond("An unexpected error occurred!");
                } catch {}
                throw error;
            }
        }
    } else if (interaction.isAutocomplete()) {
        if (commands.has(interaction.commandName)) {
            await autocompletes.get(interaction.commandName)(interaction);
        }
    }

    if (interaction_listener) {
        try {
            const response = await interaction_listener(interaction);
            if (response) {
                await interaction.respond(response);
            }
        } catch (error) {
            try {
                await interaction.respond("An unexpected error occurred!");
            } catch {}
            throw error;
        }
    }
});

client.login(config.discord_token);
