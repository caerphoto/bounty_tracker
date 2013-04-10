/*jslint node: true, devel: true*/

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
        utils = require("utils"),
        db = redis.createClient(),
        guild_key;

    if (!req.body.guildname || !req.body.password) {
        res.send(403); // Forbidden
    }

    guild_key = utils.generateKey(req.body.guildname);

    db.hgetall("guild:" + guild_key, function (err, reply) {
        var response_data = {};

        db.quit();
        if (!reply) {
            return res.send(404);
        }

        if (req.body.password === reply.admin_pw) {
            req.session.guild_key = guild_key;
            req.session.is_admin = true;

            response_data.is_admin = true;
            response_data.guild_data = {
                guildname: reply.guildname,
                admin_email: reply.admin_email,
                member_pw: reply.member_pw
            };
            response_data.search_state = JSON.parse(reply.search_state);
            return res.json(response_data);
        }

        if (req.body.password === reply.member_pw) {
            req.session.guild_key = guild_key;

            response_data.guild_data = {
                guildname: reply.guildname
            };
            response_data.search_state = JSON.parse(reply.search_state);
            return res.json(response_data);
        }
    });
};
