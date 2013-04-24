"use strict";

var randomPassword,
    sendEmail;

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
            "The admin password for the guild #" + guildname + "' has been reset to:",
            password,
            "For extra security (and because it's not very memorable), please change it the next time you log in.",
            "- Guild Bounty Tracker · http://caerphoto.com/guild_bounty/"
        ].join("\r\n\r\n"),
        mailer = require("nodemailer").createTransport("sendmail");

    mailer.sendMail({
        from: "no-reply@caerphoto.com",
        to: email,
        subject: "[Guild Bounty Tracker] Password reset for " + guildname,
        text: msg
    }, callback);
}

exports.reset = function (req, res) {
    var redis = require("redis"),
        utils = require("../lib/utils"),
        bcrypt = require("bcrypt"),
        db = redis.createClient(),
        guild_key;

    if (!req.body.guildname || !req.body.admin_email) {
        return res.send(400); // Bad request
    }

    req.body.admin_email = req.body.admin_email.toLowerCase();

    guild_key = utils.generateKey(req.body.guildname);

    db.exists(guild_key, function (err, exists) {
        if (!exists) {
            db.quit();
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
                    db.quit();

                    utils.log(
                        "PASSWORD RESET",
                        guild_key.slice(6)
                    );
                    res.send(204);
                });
            });
        });
    });
};
