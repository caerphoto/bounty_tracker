/*jslint node: true, devel: true*/

exports.create = function (req, res) {
    "use strict";

    var utils = require("utils"),
        redis = require("redis"),
        valid = utils.validateParams(req.body),
        required_fields = [
            "guildname",
            "admin_pw"
        ],
        stored_fields = [
            "guildname",
            "admin_pw",
            "admin_email",
            "member_pw"
        ],
        db,
        guild_key;

    if (valid !== true) {
        return res.json(400, valid);
    }

    valid = true;
    required_fields.forEach(function (field) {
        if (!req.body[field]) {
            valid = [field, "missing"];
        }
        return false;
    });

    if (valid !== true) {
        return res.json(400, valid);
    }

    // Create a key for the guild by converting to lower case and replacing
    // spaces with underscores.
    guild_key = utils.generateKey(req.body.guildname);

    db = redis.createClient();
    db.on("error", function (err) {
        console.log("Redis Error:", err);
    });

    db.exists("guild:" + guild_key, function (err, reply) {
        var values = {};

        if (reply) {
            // Guild already exists.
            return res.json(400, ["guildname", "exists"]);
        }

        // otherwise, guild does not exist and we can continue

        req.body.admin_email = req.body.admin_email.toLowerCase();

        // Create an array of field/value strings to pass to redis.
        stored_fields.forEach(function (field) {
            values[field] = req.body[field];
        });
        values.search_state = JSON.stringify(utils.createNewState());

        db.hmset("guild:" + guild_key, values);

        db.hgetall("guild:" + guild_key, function (err, reply) {
            db.quit();
            if (reply) {
                req.session.guild_key = guild_key;
                req.session.is_admin = true;
                res.json(200, { guild_data: reply });
            } else {
                res.send(404);
            }
        });
    });
};
