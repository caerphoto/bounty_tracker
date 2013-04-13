/*jslint node: true, devel: true*/

exports.create = function (req, res) {
    "use strict";

    var utils = require("../lib/utils"),
        redis = require("redis"),
        bcrypt = require("bcrypt"),
        valid = utils.validateParams(req.body),
        required_fields = [
            "guildname",
            "admin_pw"
        ],
        stored_fields = [
            "guildname",
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

    guild_key = utils.generateKey(req.body.guildname);

    db = redis.createClient();
    db.on("error", function (err) {
        console.log("Redis Error:", err);
    });

    db.exists(guild_key, function (err, exists) {
        var values = {};

        if (exists) {
            // Guild already exists.
            return res.json(400, ["guildname", "exists"]);
        }

        // otherwise, guild does not exist and we can continue

        req.body.admin_email = req.body.admin_email.toLowerCase();

        stored_fields.forEach(function (field) {
            values[field] = req.body[field];
        });
        values.search_state = JSON.stringify(utils.createNewState());
        bcrypt.hash(req.body.admin_pw, 8, function (err, hash) {
            var ONE_DAY_IN_S = 24 * 60 * 60;

            values.admin_pw = hash;

            db.hmset(guild_key, values);
            if (req.body.temporary) {
                db.expire(guild_key, ONE_DAY_IN_S);
            }

            db.hgetall(guild_key, function (err, reply) {
                var new_guild,
                    TWO_WEEKS_IN_MS = 1209600000; // in milliseconds

                db.quit();
                if (reply) {
                    req.session.guild_key = guild_key;
                    req.session.is_admin = true;
                    req.session.cookie.maxAge = TWO_WEEKS_IN_MS;

                    new_guild = {
                        admin_email: reply.admin_email,
                        member_pw: reply.member_pw,
                        guildname: reply.guildname,
                        search_state: reply.search_state
                    };
                    res.json(200, { guild_data: new_guild });
                } else {
                    res.send(404);
                }
            });
        });
    });
};
