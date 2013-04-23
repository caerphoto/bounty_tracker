"use strict";

exports.fetch = function (req, res) {
    // Simplest method: return entire state as JSON if different, otherwise send
    // an HTTP 204 ("No content") response to indicate that nothing has changed.
    var redis = require("redis"),
        db = redis.createClient();

    // Not logged in.
    if (!req.session.guild_key) {
        return res.send(403);
    }

    db.hgetall(req.session.guild_key, function (err, reply) {
        db.quit();

        if (!reply) {
            return res.send(500);
        }

        if (reply.search_state === req.session.prev_state) {
            return res.send(204); // No content
        } else {
            req.session.prev_state = reply.search_state;
            return res.send(reply.search_state);
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
    var //npc = req.body.npc,
        guild_key = req.session.guild_key,
        redis = require("redis"),
        db;

    // Not logged in.
    if (!guild_key) {
        return res.send(403);
    }

    db = redis.createClient();
    db.hget(guild_key, "search_state", function (err, full_state) {
        var utils = require("../lib/utils"),
            npc_short_name = req.body.npc_short_name,
            player_name,
            npc_state;

        if (err) {
            return res.send(500);
        }

        if (!full_state) {
            full_state = utils.createNewState();
        } else {
            full_state = JSON.parse(full_state);
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
                db.quit();
                if (!req.session.is_admin) {
                    req.session.assignment = npc_short_name;
                    req.session.this_player = req.body.player_name;
                }

                if (!new_state) {
                    return res.send(500);
                }

                req.session.prev_state = new_state;
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
        guild_key = req.session.guild_key,
        redis = require("redis"),
        db;

    if (!guild_key) {
        return res.send(403);
    }

    if (!req.session.is_admin && req.session.this_player !== player_name) {
        return res.send(403);
    }

    if (!player_name || !npc_short_name) {
        return res.send(400);
    }

    db = redis.createClient();
    db.hget(guild_key, "search_state", function (err, npc_state) {
        if (err || !npc_state) {
            return res.send(500);
        }

        npc_state = JSON.parse(npc_state);
        if (!npc_state.players) {
            npc_state.players = [];
        }
        // Tidy up a bit.
        if (npc_state.player) {
            delete npc_state.player;
        }

        removeFromList(player_name, npc_state[npc_short_name].players);
        npc_state = JSON.stringify(npc_state);

        db.hset(guild_key, "search_state", npc_state, function () {
            db.hget(guild_key, "search_state", function (err, new_state) {
                db.quit();

                if (!new_state) {
                    return res.send(500);
                }

                req.session.prev_state = new_state;
                return res.send(new_state);
            });
        });
    });
}; // exports.removePlayer()

exports.setNPCState = function (req, res) {
    // Sets the 'found' state of an NPC to either true or false.
    var guild_key = req.session.guild_key,
        redis = require("redis"),
        db;

    if (!guild_key) {
        return res.send(403);
    }

    db = redis.createClient();
    db.hgetall(guild_key, function (err, guild_data) {
        var short_name = req.body.short_name,
            found = req.body.found === "true",
            utils = require("../lib/utils"),
            state;

        if (!guild_data) {
            return res.send(500);
        }

        if (!guild_data.search_state) {
            state = utils.createNewState();
        } else {
            state = JSON.parse(guild_data.search_state);
        }

        state[short_name].found = found;
        state = JSON.stringify(state);

        db.hset(guild_key, "search_state", state, function () {
            db.hget(guild_key, "search_state", function (err, new_state) {
                db.quit();

                if (!new_state) {
                    return res.send(500);
                }
                req.session.prev_state = new_state;
                // No need to send the full state since we're only toggling a
                // boolean.
                return res.send(JSON.parse(new_state)[short_name].found);
            });
        });
    });
}; // exports.setNPCState()

exports.resetState = function (req, res) {
    var guild_key = req.session.guild_key,
        redis = require("redis"),
        db;

    if (!guild_key || req.session.is_admin) {
        return res.send(403);
    }

    db = redis.createClient();
    db.exists(guild_key, function (err, exists) {
        var utils = require("../lib/utils"),
            new_state = utils.createNewState();

        if (!exists) {
            return res.send(500);
        }

        db.hset(guild_key, "search_state", new_state, function () {
            return res.json(new_state);
        });
    }); // db.hgetall()
};
