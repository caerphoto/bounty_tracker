var renderNoGuild = function (res) {
    "use strict";
    var utils = require("./lib/utils");
    res.render("index", {
        is_admin: false,
        body_class: "logged-out",
        guild_data: false,
        this_player: "",
        search_state: JSON.stringify(utils.createNewState())
    });
};

exports.index = function (req, res) {
    "use strict";

    var redis = require("redis"),
        db;

    if (req.session.guild_key) {
        db = redis.createClient();

        db.on("error", function (err) {
            console.log("Redis Error:", err);
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
                search_state: search_state
            });

            db.quit();
        });
    } else {
        // Not logged in
        renderNoGuild(res);
    }
};
