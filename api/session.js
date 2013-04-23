"use strict";
var utils = require("../lib/utils");

exports.destroy = function (req, res) {
    // Log out
    utils.log([
        req.session.guild_key,
        req.session.is_admin ? "(admin)" : "(member)",
        "LOG OUT"
    ].join(" "));
    delete req.session.guild_key;
    delete req.session.is_admin;
    delete req.session.this_player;
    delete req.session.assignment;
    req.session.destroy();
    res.send(200);
};

exports.create = function (req, res) {
    var redis = require("redis"),
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

                try {
                    response_data.search_state = JSON.parse(reply.search_state);
                } catch (e) {
                    response_data.search_state = utils.createNewState();
                }

                // Track login stuff for analysis.
                utils.recordLogin(guild_key);
            }

            if (match) {
                req.session.is_admin = true;
                response_data.is_admin = true;
                response_data.guild_data = {
                    guildname: reply.guildname,
                    admin_email: reply.admin_email,
                    member_pw: reply.member_pw
                };
                utils.log([
                    guild_key,
                    "(admin)",
                    "LOG IN"
                ].join(" "));
                return res.json(response_data);
            }

            // Doesn't match admin password, so maybe it matches member pw?
            if (req.body.password === reply.member_pw) {
                response_data.guild_data = {
                    guildname: reply.guildname
                };
                utils.log([
                    guild_key,
                    "(member)",
                    "LOG IN"
                ].join(" "));
                return res.json(response_data);
            }

            // Doesn't match anything.
            return res.send(403);
        });
    });
};
