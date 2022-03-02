import { scheduled } from "../commands/schedule.js";
import { config } from "../config.js";
import {
    increase_user_xp,
    increase_xp,
    list_xp_blocked_channels,
    list_xp_roles,
} from "../db.js";

const last_message = new Map();

var locked = false;

export function lock_xp() {
    locked = true;
}

export function unlock_xp() {
    locked = false;
}

export async function handle(message) {
    // XP
    if (
        !locked &&
        message.guild &&
        message.guild.id == config.guild_id &&
        !message.webhookId &&
        !message.author.bot
    ) {
        const xp_block = await list_xp_blocked_channels();
        if (
            !xp_block.has(message.channel.id) &&
            !xp_block.has(message.channel.parentId)
        ) {
            const now = new Date();
            const xp =
                Math.min(
                    now - (last_message.get(message.author.id) || 0),
                    120000
                ) / 12000;
            last_message.set(message.author.id, now);
            await add_xp(message.member, xp);
        }
    }
    // random events
    if (
        !message.webhookId &&
        !message.author.bot &&
        scheduled.has(message.channel.id)
    ) {
        for (const [_, item] of scheduled.get(message.channel.id)) {
            if (item.activity_scaling) {
                item.date.setSeconds(
                    item.date.getSeconds() - item.activity_scaling
                );
            }
        }
    }
}

export async function add_xp(member, xp, skip_personal) {
    const roles = await list_xp_roles();
    for (const role_id of member.roles.cache.keys()) {
        if (roles.has(role_id)) {
            await increase_xp(role_id, xp);
        }
    }
    if (!skip_personal) await increase_user_xp(member.id, xp);
}
