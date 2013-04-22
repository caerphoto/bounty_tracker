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

        if (false && reply.search_state === req.session.prev_state) {
            return res.send(204); // No content
        } else {
            req.session.prev_state = reply.search_state;
            return res.send(reply.search_state);
        }
    });
};

exports.assignPlayer = function (req, res) {
    // Adds a player name to an NPC's list of assigned players.
    var //npc = req.body.npc,
        guild_key = req.session.guild_key,
        redis = require("redis"),
        db;

    // Not logged in.
    if (!guild_key) {
        return res.send(403);
    }

    db = redis.createClient();
    db.hgetall(guild_key, function (err, guild_data) {
        var utils = require("../lib/utils"),
            npc_short_name = req.body.npc_short_name,
            player_name,
            full_state,
            npc_state;

        if (!guild_data) {
            return res.send(500);
        }

        if (!guild_data.search_state) {
            full_state = utils.createNewState();
        } else {
            full_state = JSON.parse(guild_data.search_state);
        }

        npc_state = full_state[npc_short_name];

        if (!npc_state.players) {
            npc_state.players = [];
        }


        // Search for given player in other NPCs' players[] lists and remove it,
        // to prevent a player from being assigned to more than one NPC.
        player_name = req.body.player_name.toUpperCase();
        utils.each(full_state, function (npc) {
            var found,
                index;

            found = npc.players.some(function (name, i) {
                index = i;
                return name.toUpperCase() === player_name;
            });

            if (found) {
                npc.players.splice(index, 1);
            }
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
    var //npc = req.body.npc,
        guild_key = req.session.guild_key;

    if (!guild_key) {
        return res.send(403);
    }
};

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
