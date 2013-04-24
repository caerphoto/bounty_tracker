"use strict";

function renderNoGuild(res) {
    var utils = require("./lib/utils");
    res.render("index", {
        is_admin: false,
        body_class: "logged-out",
        guild_data: false,
        this_player: "",
        assignment: "",
        search_state: JSON.stringify(utils.createNewState())
    });
}

exports.index = function (req, res) {
    var redis = require("redis"),
        utils = require("./lib/utils"),
        db;

    if (req.session.guild_key) {
        db = redis.createClient();

        db.on("error", function (err) {
            utils.log("Redis Error", err);
        });

        db.hgetall(req.session.guild_key, function (err, reply) {
            var guild_data,
                search_state,
                is_admin = req.session.is_admin;

            if (!reply) {
                // Guild registration has expored or been deleted since last
                // login.
                return renderNoGuild(res);
            }

            search_state = reply.search_state;

            try {
                JSON.parse(search_state);
            } catch (e) {
                search_state = JSON.stringify(utils.createNewState());
            }

            if (is_admin) {
                guild_data = {
                    guildname: reply.guildname,
                    admin_email: reply.admin_email,
                    member_pw: reply.member_pw
                };
            } else {
                guild_data = {
                    guildname: reply.guildname
                };
            }

            res.render("index", {
                is_admin: is_admin,
                body_class: "logged-in " + (is_admin ? "admin" : "member"),
                guild_data: guild_data,
                this_player: req.session.this_player || "",
                assignment: req.session.assignment || "",
                search_state: search_state
            });

            db.quit();
        });
    } else {
        // Not logged in
        renderNoGuild(res);
    }
};
