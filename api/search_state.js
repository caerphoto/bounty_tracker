"use strict";
var redis = require("redis"),
    utils = require("../lib/utils"),
    db = redis.createClient();

function updateTimestamp(key) {
    db.hset(key, "last_modified", Date.now());
}

exports.fetch = function (req, res) {
    // Simplest method: return entire state as JSON if different, otherwise send
    // an HTTP 204 ("No content") response to indicate that nothing has changed.

    // Not logged in.
    if (!req.session.guild_key) {
        return res.send(403, "Not logged in.");
    }

    // The count is decreased after 6 seconds as a sort of buffer against the
    // default 3-second request interval used by the client.
    db.incr("bounty:user count");
    setTimeout(function () {
        db.decr("bounty:user count");
    }, 6000);

    db.hget(req.session.guild_key, "search_state", function (err, state) {
        // If state has changed in the time between the previous response and
        // this request being sent, return a reply immediately.
        if (state === req.session.prev_state) {
            return res.send(204);
        } else {
            req.session.prev_state = state;
            res.set("Content-Type", "application/json");
            return res.send(state);
        }
    });
};

function removeFromList(player_name, list) {
    // Performs a case-insensitive search for the given name in the list, and
    // removes that name.
    var found,
        index;

    if (!player_name || !list) {
        return false;
    }

    player_name = player_name.toUpperCase();

    found = list.some(function (name, i) {
        index = i;
        return name.toUpperCase() === player_name;
    });

    if (found) {
        list.splice(index, 1);
        return true;
    }

    return false;
}

exports.assignPlayer = function (req, res) {
    // Adds a player name to an NPC's list of assigned players, whilst also
    // ensuring that player does not appear in any other NPC's list.
    var guild_key = req.session.guild_key;

    // Not logged in.
    if (!guild_key) {
        return res.send(403);
    }

    db.hget(guild_key, "search_state", function (err, full_state) {
        var npc_short_name = req.body.npc_short_name,
            player_name,
            npc_state;

        if (err) {
            return res.send(500);
        }

        if (!npc_short_name) {
            return res.send(400);
        }

        try {
            full_state = JSON.parse(full_state);
        } catch (e) {
            full_state = utils.createNewState();
        }

        npc_state = full_state[npc_short_name];

        // Search for given player in other NPCs' players[] lists and remove it,
        // to prevent a player from being assigned to more than one NPC.
        player_name = req.body.player_name.toUpperCase();
        utils.each(full_state, function (npc) {
            if (!npc.players) {
                npc.players = [];
            }
            removeFromList(player_name, npc.players);
        });

        npc_state.players.push(req.body.player_name);
        full_state = JSON.stringify(full_state);

        db.hset(guild_key, "search_state", full_state, function () {
            db.hget(guild_key, "search_state", function (err, new_state) {
                if (!req.session.is_admin) {
                    req.session.assignment = npc_short_name;
                    req.session.this_player = req.body.player_name;
                }

                if (!new_state) {
                    return res.send(500);
                }

                updateTimestamp(guild_key);
                utils.log(
                    "ASSIGN",
                    guild_key.slice(6),
                    req.session.is_admin ? "a" : "m",
                    req.body.player_name,
                    npc_short_name
                );

                return res.send(new_state);
            });
        });

    }); // db.hgetall()
}; // exports.assignPlayer()

exports.removePlayer = function (req, res) {
    // Removes a player name from an NPC's list of assigned players.
    // If the player is not in the list, returns HTTP 404.
    var npc_short_name = req.body.npc_short_name,
        player_name = req.body.player_name,
        guild_key = req.session.guild_key;

    if (!guild_key) {
        return res.send(403, "You are not logged in.");
    }

    if (!req.session.is_admin && req.session.this_player !== player_name) {
        return res.send(403, "HTTP 403 Forbidden: unable to deassign you. Assign youself to another NPC then try again.");
    }

    if (!player_name || !npc_short_name) {
        return res.send(400, "HTTP 400 Invalid request: no player or NPC name given.");
    }

    db.hget(guild_key, "search_state", function (err, state) {
        if (err || !state) {
            return res.send(500, "HTTP 500: unable to retrieve search state.");
        }

        try {
            state = JSON.parse(state);
            removeFromList(player_name, state[npc_short_name].players);
        } catch (e) {
            state = utils.createNewState();
        }

        state = JSON.stringify(state);

        db.hset(guild_key, "search_state", state, function () {
            db.hget(guild_key, "search_state", function (err, new_state) {
                if (!new_state) {
                    return res.send(500, "HTTP 500: unable to retrieve state after saving it.");
                }

                updateTimestamp(guild_key);
                utils.log(
                    "REMOVE",
                    guild_key.slice(6),
                    req.session.is_admin ? "a" : "m",
                    player_name,
                    npc_short_name
                );

                return res.send(new_state);
            });
        });
    });
}; // exports.removePlayer()

exports.setNPCState = function (req, res) {
    // Sets the 'found' state of an NPC to either true or false.
    var guild_key = req.session.guild_key;

    if (!guild_key) {
        return res.send(403);
    }

    db.hgetall(guild_key, function (err, guild_data) {
        var short_name = req.body.short_name,
            found = req.body.found === "true",
            state;

        if (!guild_data) {
            return res.send(500);
        }

        try {
            state = JSON.parse(guild_data.search_state);
        } catch (e) {
            state = utils.createNewState();
        }

        state[short_name].found = found;
        state = JSON.stringify(state);

        db.hset(guild_key, "search_state", state, function () {
            db.hget(guild_key, "search_state", function (err, new_state) {
                var state_obj;

                if (!new_state) {
                    return res.send(500);
                }

                updateTimestamp(guild_key);
                if (found) {
                    utils.log(
                        "FOUND",
                        guild_key.slice(6),
                        req.session.is_admin ? "a" : "m",
                        req.session.this_player || "<admin>",
                        short_name
                    );
                } else {
                    utils.log(
                        "LOST",
                        guild_key.slice(6),
                        req.session.is_admin ? "a" : "m",
                        req.session.this_player || "<admin>",
                        short_name
                    );
                }

                // Ensure state was stored then retrieved correctly.
                try {
                    state_obj = JSON.parse(new_state);
                } catch (e) {
                    state_obj = utils.createNewState();
                    new_state = JSON.stringify(state_obj);
                }

                // No need to send the full state since we're only toggling a
                // boolean.
                return res.send(state_obj[short_name].found);
            });
        });
    });
}; // exports.setNPCState()

exports.resetState = function (req, res) {
    var guild_key = req.session.guild_key;

    if (!guild_key || !req.session.is_admin) {
        return res.send(403);
    }

    db.exists(guild_key, function (err, exists) {
        var new_state = JSON.stringify(utils.createNewState());

        if (!exists) {
            return res.send(500);
        }

        db.hset(guild_key, "search_state", new_state, function () {
            updateTimestamp(guild_key);
            utils.log(
                "RESET",
                guild_key.slice(6),
                req.session.is_admin ? "a" : "m"
            );

            return res.send(new_state);
        });
    }); // db.exists()
};
