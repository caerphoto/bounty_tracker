/*jslint node: true, devel: true*/
var renderNoGuild = function (res) {
    "use strict";
    res.render("index", {
        body_class: "",
        guild_data: false,
        search_state: false
    });
};

exports.index = function (req, res, data) {
    "use strict";

    var redis = require("redis"),
        db;

    if (req.session.guild_key) {
        db = redis.createClient();

        db.on("error", function (err) {
            console.log("Redis Error:", err);
        });

        db.hgetall("guild:" + req.session.guild_key, function (err, reply) {
            var guild_data,
                search_state,
                is_admin = req.session.is_admin;

            if (!reply) {
                // Guild has been deleted since last login.
                return renderNoGuild(res);
            }

            search_state = reply.search_state;

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
                body_class: "logged-in " + (is_admin ? "admin" : ""),
                guild_data: guild_data,
                search_state: search_state
            });

            db.quit();
        });
    } else {
        // Not logged in
        renderNoGuild(res);
    }
};
