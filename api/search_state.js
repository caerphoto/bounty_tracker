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

exports.assignPlayer = function (req, res) {
    // Adds a player name to an NPC's list of assigned players.
    var npc = req.body.npc,
        guild_key = req.session.guild_key;

    // Not logged in.
    if (!guild_key) {
        return res.send(403);
    }
};

exports.removePlayer = function (req, res) {
    // Removes a player name from an NPC's list of assigned players.
    // If the player is not in the list, returns HTTP 404.
    var npc = req.body.npc,
        guild_key = req.session.guild_key;

    if (!guild_key) {
        return res.send(403);
    }
};

exports.setNPCState = function (req, res) {
    // Sets the 'found' state of an NPC to either true or false.
    var npc = req.body.npc,
        state = req.body.state,
        guild_key = req.session.guild_key;

    if (!guild_key) {
        return res.send(403);
    }
};

exports.update = function (req, res) {
    var redis = require("redis"),
        utils = require("../lib/utils"),
        db = redis.createClient(),
        guild_key = req.session.guild_key;

    // Not logged in.
    if (!guild_key) {
        return res.send(403);
    }

    // Update requests must contain the following parameters:
    // short_name: the code for the NPC whose state is being updated
    // player: the name of the player searching for the NPC
    // found: a string either "true" or "false", indicating the NPC's found state

    db.hgetall(guild_key, function (err, guild_data) {
        var state;

        if (!guild_data) {
            return res.send(500);
        }

        if (req.body.short_name === "__ALL__") {
            state = utils.createNewState();
        } else {
            if (!guild_data.search_state) {
                state = utils.createNewState();
            } else {
                state = JSON.parse(guild_data.search_state);
            }

            state[req.body.short_name] = {
                player: JSON.parse(req.body.players),
                found: req.body.found === "true"
            };
        }

        state = JSON.stringify(state);

        db.hset(guild_key, "search_state", state);
        db.hget(guild_key, "search_state", function (err, new_state) {
            db.quit();

            if (!new_state) {
                return res.send(500);
            }
            req.session.prev_state = new_state;
            return res.send(new_state);
        });
    });

};
