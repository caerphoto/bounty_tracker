exports.destroy = function (req, res) {
    // Log out
    "use strict";
    delete req.session.guildname;
    delete req.session.is_admin;
    req.session.destroy();
    res.send(200);
};

exports.create = function (req, res) {
    "use strict";
    var redis = require("redis"),
        utils = require("../lib/utils"),
        bcrypt = require("bcrypt"),
        db = redis.createClient(),
        guild_key;

    if (!req.body.guildname || !req.body.password) {
        res.send(403); // Forbidden
    }

    guild_key = utils.generateKey(req.body.guildname);

    db.hgetall(guild_key, function (err, reply) {
        db.quit();

        if (!reply) {
            return res.send(403);
        }
        bcrypt.compare(req.body.password, reply.admin_pw, function (err, match) {
            var TWO_WEEKS_IN_MS = 1209600000, // in milliseconds
                response_data = {};

            // Common actions for admin or member login
            if (match || req.body.password === reply.member_pw) {
                req.session.guild_key = guild_key;
                req.session.cookie.maxAge = TWO_WEEKS_IN_MS;

                response_data.search_state = JSON.parse(reply.search_state);

                // Track login stuff for analysis.
                db = redis.createClient();
                db.set("login:" + guild_key, Date.now());
                db.incr("login:count:" + guild_key);
                db.quit();
            }

            if (match) {
                req.session.is_admin = true;
                response_data.is_admin = true;
                response_data.guild_data = {
                    guildname: reply.guildname,
                    admin_email: reply.admin_email,
                    member_pw: reply.member_pw
                };
                return res.json(response_data);
            }

            // Doesn't match admin password, so maybe it matches member pw?
            if (req.body.password === reply.member_pw) {
                response_data.guild_data = {
                    guildname: reply.guildname
                };
                return res.json(response_data);
            }

            // Doesn't match anything.
            return res.send(403);
        });
    });
};
