import { config } from "../config.js";
import {
    add_answer,
    create_question,
    delete_answer,
    delete_question,
    get_question,
    list_answers,
    list_questions,
} from "../db.js";
import { ac_substring } from "../utils.js";

const question = {
    name: "question",
    description: "the question",
    type: "STRING",
    required: true,
    autocomplete: true,
};

export const command = {
    name: "trivia",
    description: "Trivia Commands.",
    type: "CHAT_INPUT",
    options: [
        {
            name: "create_question",
            description: "Create a new question.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "question",
                    description: "the question",
                    type: "STRING",
                    required: true,
                },
                {
                    name: "image",
                    description: "image URL (optional)",
                    type: "STRING",
                },
                {
                    name: "answer",
                    description: "the answer (more can be added/removed later)",
                    type: "STRING",
                },
            ],
        },
        {
            name: "delete_question",
            description: "Delete a question.",
            type: "SUB_COMMAND",
            options: [question],
        },
        {
            name: "add_answer",
            description: "Add an answer to a question.",
            type: "SUB_COMMAND",
            options: [
                question,
                {
                    name: "answer",
                    description: "the answer",
                    type: "STRING",
                    required: true,
                },
            ],
        },
        {
            name: "delete_answer",
            description: "Delete an answer from a question.",
            type: "SUB_COMMAND",
            options: [
                question,
                {
                    name: "answer",
                    description: "the answer",
                    type: "STRING",
                    required: true,
                },
            ],
        },
        {
            name: "list_answers",
            description: "List the answers for a question.",
            type: "SUB_COMMAND",
            options: [question],
        },
    ],
};

export async function execute(interaction) {
    if (config.owners.indexOf(interaction.user.id) == -1) {
        return "Only bot owners can use trivia commands.";
    }
    const question = interaction.options.getString("question");
    const image = interaction.options.getString("image");
    var answer = interaction.options.getString("answer");
    if (answer) answer = answer.toLowerCase();
    const id = await get_question(question);
    switch (interaction.options.getSubcommand()) {
        case "create_question":
            if (id) return "That question already exists.";
            const new_id = await create_question(question, image);
            if (answer) {
                await add_answer(new_id, answer);
            }
            return "Created.";
        case "delete_question":
            if (!id) return "That question does not exist.";
            await delete_question(id);
            return "Deleted.";
        case "add_answer":
            if (!id) return "That question does not exist.";
            await add_answer(id, answer);
            return "Added.";
        case "delete_answer":
            if (!id) return "That question does not exist.";
            await delete_answer(id, answer);
            return "Deleted.";
        case "list_answers":
            if (!id) return "That question does not exist.";
            return (await list_answers(id)).join(", ") || "(no answers)";
    }
}

export async function autocomplete(interaction) {
    if (config.owners.indexOf(interaction.user.id) == -1) {
        return [];
    }
    await ac_substring(
        interaction,
        (await list_questions()).map((entry) => entry.question)
    );
}
