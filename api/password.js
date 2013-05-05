"use strict";

var randomPassword,
    sendEmail,
    secrets = require("../lib/secrets"),
    redis = require("redis"),
    db = redis.createClient();

function randomPassword(length) {
    var chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789_",
        pass = [],
        i;

    pass.length = length;
    for (i = 0; i < length; i += 1) {
        pass[i] = chars.charAt(Math.round(Math.random() * chars.length));
    }

    return pass.join("");
}

function sendEmail(guildname, email, password, callback) {
    var msg = [
            "The admin password for the guild '" + guildname + "' has been reset to:",
            password,
            "For extra security (and because it's not very memorable), please change it the next time you log in.",
            "- Guild Bounty Tracker · http://bounty.caer.me/"
        ].join("\r\n\r\n"),

        mailer = require("nodemailer").createTransport("SMTP", secrets.smtp_options);

    try {
        mailer.sendMail({
            from: secrets.from_email,
            to: email,
            subject: "[Guild Bounty Tracker] Password reset for " + guildname,
            text: msg
        }, callback);
    } catch (e) {
        if (typeof callback === "function") {
            callback("exception when calling mailer.sendMail()");
        }
    }
}

exports.reset = function (req, res) {
    var utils = require("../lib/utils"),
        bcrypt = require("bcrypt"),
        guild_key;

    if (!req.body.guildname || !req.body.admin_email) {
        return res.send(400); // Bad request
    }

    req.body.admin_email = req.body.admin_email.toLowerCase();

    guild_key = utils.generateKey(req.body.guildname);

    db.exists(guild_key, function (err, exists) {
        if (!exists) {
            return res.send(404);
        }
        db.hmget(guild_key, "guildname", "admin_email", function (err, reply) {
            var new_password = randomPassword(20),
                guildname = reply[0],
                admin_email = reply[1];

            if (req.body.admin_email !== admin_email) {
                return res.send(403);
            }

            bcrypt.hash(new_password, 8, function (err, hash) {

                sendEmail(guildname, admin_email, new_password, function (err) {
                    if (err) {
                        console.log("Mailer error:", err);
                        return res.send(500);
                    }

                    db.hset(guild_key, "admin_pw", hash);

                    utils.log(
                        "PASSWORD",
                        guild_key.slice(6)
                    );
                    res.send(204);
                });
            });
        });
    });
};
