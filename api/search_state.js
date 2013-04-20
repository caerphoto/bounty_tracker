exports.fetch = function (req, res) {
    "use strict";
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

exports.update = function (req, res) {
    "use strict";
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
