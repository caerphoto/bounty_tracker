var redis = require("redis"),
    db = redis.createClient();

exports.update = function (req, res) {
    "use strict";
    var guild_key = req.session.guild_key,
        bcrypt = require("bcrypt"),
        utils = require("../lib/utils");

    if (!guild_key || !req.session.is_admin) {
        return res.send(403); // Forbidden
    }

    db.exists(guild_key, function (err, exists) {
        var new_data = {};

        if (!exists) {
            return res.send(404);
        }

        if (req.body.admin_email) {
            new_data.admin_email = req.body.admin_email.toLowerCase();
        }

        if (req.body.member_pw) {
            new_data.member_pw = req.body.member_pw;
        }

        if (req.body.admin_pw) {
            if (!req.body.admin_pw_confirm) {
                return res.json(400, ["admin_pw_confirm", "missing"]);
            }
            if (req.body.admin_pw !== req.body.admin_pw_confirm) {
                return res.json(400, ["admin_pw_confirm", "mismatch"]);
            }

            // Use sync version because trying to make this async hurts my head.
            // May need to change this if it becomes the target of a DDoS
            // attack.
            new_data.admin_pw = bcrypt.hashSync(req.body.admin_pw, 8);
        }

        db.hmset(guild_key, new_data, function () {
            db.hgetall(guild_key, function (err, guild_data) {
                var response_data;

                if (!guild_data) {
                    return res.send(500);
                }

                response_data = {
                    admin_email: guild_data.admin_email,
                    member_pw: guild_data.member_pw
                };

                utils.log(
                    "UPDATE GUILD",
                    guild_data.guildname
                );

                return res.json(response_data);
            });
        });
    });

};
