import { db } from "./db_client.js";

var xp_role_cache;
var xp_channel_block_cache;

export async function add_xp_role(role_id) {
    await db.query(
        `INSERT INTO xp (
            role_id
        ) VALUES ($1) ON CONFLICT (
            role_id
        ) DO UPDATE SET xp = xp.xp`,
        [role_id]
    );
    if (xp_role_cache) xp_role_cache.add(role_id);
}

export async function rm_xp_role(role_id) {
    await db.query(`DELETE FROM xp WHERE role_id = $1`, [role_id]);
    if (xp_role_cache) xp_role_cache.delete(role_id);
}

export async function clear_xp_roles() {
    await db.query(`DELETE FROM xp`);
    if (xp_role_cache) xp_role_cache.clear();
}

export async function increase_xp(role_id, xp) {
    await db.query(`UPDATE xp SET xp = xp + $1 WHERE role_id = $2`, [
        xp,
        role_id,
    ]);
}

export async function list_xp_roles() {
    if (xp_role_cache) return xp_role_cache;
    return (xp_role_cache = new Set(
        (await db.query(`SELECT role_id FROM xp`)).rows.map(
            (entry) => entry.role_id
        )
    ));
}

export async function increase_user_xp(user_id, xp) {
    await db.query(
        `INSERT INTO user_xp (
            user_id, xp
        ) VALUES ($1, $2) ON CONFLICT (
            user_id
        ) DO UPDATE SET xp = user_xp.xp + $2`,
        [user_id, xp]
    );
}

export async function get_user_xp(user_id) {
    return (
        (await db.query(`SELECT xp FROM user_xp WHERE user_id = $1`, [user_id]))
            .rows[0] || { xp: 0 }
    ).xp;
}

export async function reset_user_xp() {
    await db.query(`DELETE FROM user_xp`);
}

export async function top_10_user_xp() {
    return (await db.query(`SELECT * FROM user_xp ORDER BY xp DESC LIMIT 10`))
        .rows;
}

export async function leaderboard() {
    return (await db.query(`SELECT * FROM xp`)).rows;
}

export async function block_channel_xp(channel_id) {
    await db.query(
        `INSERT INTO no_xp_channels (
            channel_id
        ) VALUES ($1) ON CONFLICT (
            channel_id
        ) DO UPDATE SET channel_id = no_xp_channels.channel_id`,
        [channel_id]
    );
    if (xp_channel_block_cache) xp_channel_block_cache.add(channel_id);
}

export async function unblock_channel_xp(channel_id) {
    await db.query(`DELETE FROM no_xp_channels WHERE channel_id = $1`, [
        channel_id,
    ]);
    if (xp_channel_block_cache) xp_channel_block_cache.delete(channel_id);
}

export async function list_xp_blocked_channels() {
    if (xp_channel_block_cache) return xp_channel_block_cache;
    return (xp_channel_block_cache = new Set(
        (await db.query(`SELECT channel_id FROM no_xp_channels`)).rows.map(
            (entry) => entry.channel_id
        )
    ));
}

export async function set_money(user_id, money) {
    await db.query(
        `INSERT INTO economy (
            user_id, money
        ) VALUES ($1, $2) ON CONFLICT (
            user_id
        ) DO UPDATE SET money = $2`,
        [user_id, money]
    );
}

export async function add_money(user_id, money) {
    await db.query(
        `INSERT INTO economy (
            user_id, money
        ) VALUES ($1, $2) ON CONFLICT (
            user_id
        ) DO UPDATE SET money = economy.money + $2`,
        [user_id, money]
    );
}

export async function get_money(user_id) {
    return (
        (
            await db.query(`SELECT money FROM economy WHERE user_id = $1`, [
                user_id,
            ])
        ).rows[0] || { money: 0 }
    ).money;
}

export async function economy(page) {
    return (
        await db.query(
            `SELECT * FROM economy ORDER BY money DESC LIMIT 10 OFFSET $1`,
            [((page || 1) - 1) * 10]
        )
    ).rows;
}

export async function reset_economy() {
    await db.query(`DELETE FROM economy`);
}

export async function create_giveaway(
    title,
    description,
    duration,
    cooldown,
    max_tickets
) {
    return (
        await db.query(
            `INSERT INTO giveaways (title, description, duration, cooldown, max_tickets) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [title, description, duration, cooldown, max_tickets]
        )
    ).rows[0].id;
}

export async function giveaway_allow(id, snowflake) {
    await db.query(
        `INSERT INTO giveaway_access (
            id, snowflake
        ) VALUES ($1, $2) ON CONFLICT (
            id, snowflake
        ) DO UPDATE SET id = giveaway_access.id`,
        [id, snowflake]
    );
}

export async function giveaway_disallow(id, snowflake) {
    await db.query(
        `DELETE FROM giveaway_access WHERE id = $1 AND snowflake = $2`,
        [id, snowflake]
    );
}

export async function giveaway_weight(id, snowflake, weight) {
    await db.query(
        `INSERT INTO giveaway_weights (
            id, snowflake, weight
        ) VALUES ($1, $2, $3) ON CONFLICT (
            id, snowflake
        ) DO UPDATE SET weight = $3`,
        [id, snowflake, weight]
    );
}

export async function giveaway_titles() {
    return (await db.query(`SELECT title FROM giveaways`)).rows.map(
        (entry) => entry.title
    );
}

export async function unposted_giveaway_titles() {
    return (
        await db.query(`SELECT title FROM giveaways WHERE NOT posted`)
    ).rows.map((entry) => entry.title);
}

export async function active_giveaways() {
    return (
        await db.query(`SELECT * FROM giveaways WHERE end_date IS NOT NULL`)
    ).rows;
}

export async function giveaway_by_id(id) {
    return (await db.query(`SELECT * FROM giveaways WHERE id = $1`, [id]))
        .rows[0];
}

export async function get_giveaway(title) {
    return (await db.query(`SELECT * FROM giveaways WHERE title = $1`, [title]))
        .rows[0];
}

export async function is_posted(id) {
    return (await db.query(`SELECT posted FROM giveaways WHERE id = $1`, [id]))
        .rows[0].posted;
}

export async function post_giveaway(id) {
    await db.query(`DELETE FROM giveaway_entrants WHERE id = $1`, [id]);
    const duration = (
        await db.query(`SELECT duration FROM giveaways WHERE id = $1`, [id])
    ).rows[0].duration;
    const end_date = new Date();
    end_date.setMinutes(end_date.getMinutes() + duration);
    await db.query(
        `UPDATE giveaways SET end_date = $1, posted = TRUE WHERE id = $2`,
        [end_date, id]
    );
    return end_date;
}

export async function close_giveaway(id) {
    await db.query(`UPDATE giveaways SET end_date = NULL WHERE id = $1`, [id]);
}

export async function set_giveaway_message(id, message) {
    await db.query(
        `UPDATE giveaways SET channel_id = $1, message_id = $2 WHERE id = $3`,
        [message.channel.id, message.id, id]
    );
}

export async function delete_giveaway(id) {
    await db.query(`DELETE FROM giveaways WHERE id = $1`, [id]);
}

export async function giveaway_allows(id, snowflake) {
    return (
        (
            await db.query(
                `SELECT COUNT(*) FROM giveaway_access WHERE id = $1 AND snowflake = $2`,
                [id, snowflake]
            )
        ).rows[0].count > 0
    );
}

export async function get_giveaway_entrant(id, user_id) {
    await db.query(
        `INSERT INTO giveaway_entrants (
            id, user_id
        ) VALUES ($1, $2) ON CONFLICT (
            id, user_id
        ) DO UPDATE SET id = giveaway_entrants.id`,
        [id, user_id]
    );
    return (
        await db.query(
            `SELECT last_entered, tickets FROM giveaway_entrants WHERE id = $1 AND user_id = $2`,
            [id, user_id]
        )
    ).rows[0];
}

export async function enter_giveaway(id, user_id) {
    await db.query(
        `INSERT INTO giveaway_entrants (
            id, user_id, last_entered, tickets
        ) VALUES ($1, $2, $3, 1) ON CONFLICT (
            id, user_id
        ) DO UPDATE SET last_entered = $3, tickets = giveaway_entrants.tickets + 1`,
        [id, user_id, new Date()]
    );
}

export async function remove_entrant(id, user_id) {
    await db.query(
        `DELETE FROM giveaway_entrants WHERE id = $1 AND user_id = $2`,
        [id, user_id]
    );
}

export async function get_entrants(id) {
    return (
        await db.query(
            `SELECT * FROM giveaway_entrants WHERE id = $1 AND tickets > 0`,
            [id]
        )
    ).rows;
}

export async function get_giveaway_weight(id, snowflake) {
    return (
        (
            await db.query(
                `SELECT weight FROM giveaway_weights WHERE id = $1 AND snowflake = $2`,
                [id, snowflake]
            )
        ).rows[0] || { weight: undefined }
    ).weight;
}

export async function shop_owned(name, user_id) {
    return (
        (
            await db.query(
                `SELECT owned FROM shop_purchases WHERE name = $1 AND user_id = $2`,
                [name, user_id]
            )
        ).rows[0] || { owned: 0 }
    ).owned;
}

export async function last_purchase(name, user_id) {
    return (
        (
            await db.query(
                `SELECT last_purchase FROM shop_purchases WHERE name = $1 AND user_id = $2`,
                [name, user_id]
            )
        ).rows[0] || { last_purchase: undefined }
    ).last_purchase;
}

export async function buy(name, user_id, amount) {
    await db.query(
        `INSERT INTO shop_purchases (
            name, user_id, owned, last_purchase
        ) VALUES ($1, $2, $3, $4) ON CONFLICT (
            name, user_id
        ) DO UPDATE SET owned = shop_purchases.owned + $3, last_purchase = $4`,
        [name, user_id, amount, new Date()]
    );
}

export async function last_salary(user_id) {
    return (
        (
            await db.query(`SELECT last FROM salaries WHERE user_id = $1`, [
                user_id,
            ])
        ).rows[0] || { last: undefined }
    ).last;
}

export async function give_salary(user_id) {
    await db.query(
        `INSERT INTO salaries (
            user_id, last
        ) VALUES ($1, $2) ON CONFLICT (
            user_id
        ) DO UPDATE SET last = $2`,
        [user_id, new Date()]
    );
}

export async function add_event(channel_id, type, min_period, max_period) {
    await db.query(
        `INSERT INTO random_events (
            channel_id, type, min_period, max_period
        ) VALUES ($1, $2, $3, $4) ON CONFLICT (
            channel_id, type
        ) DO UPDATE SET min_period = $2, max_period = $3`,
        [channel_id, type, min_period, max_period]
    );
}

export async function post_event(channel_id, type) {
    await db.query(
        `UPDATE random_events SET last = $1 WHERE channel_id = $2 AND type = $3`,
        [new Date(), channel_id, type]
    );
}

export async function delete_event(channel_id, type) {
    await db.query(
        `DELETE FROM random_events WHERE channel_id = $1 AND type = $2`,
        [channel_id, type]
    );
}

export async function get_event(channel_id, type) {
    return (
        await db.query(
            `SELECT * FROM random_events WHERE channel_id = $1 AND type = $2`,
            [channel_id, type]
        )
    ).rows[0];
}

export async function get_events() {
    return (await db.query(`SELECT * FROM random_events`)).rows;
}
