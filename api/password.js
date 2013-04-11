/*jslint node: true, devel: true*/

var randomPassword,
    sendEmail;

randomPassword = function (length) {
    "use strict";
    var chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789_",
        pass = [],
        i;

    pass.length = length;
    for (i = 0; i < length; i += 1) {
        pass[i] = chars.charAt(Math.round(Math.random() * chars.length));
    }

    return pass.join("");
};

sendEmail = function (guildname, email, password, callback) {
    "use strict";
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
};

exports.reset = function (req, res) {
    "use strict";

    var redis = require("redis"),
        utils = require("../lib/utils"),
        bcrypt = require("bcrypt"),
        db = redis.createClient(),
        key;

    if (!req.body.guildname || !req.body.admin_email) {
        return res.send(400); // Bad request
    }

    req.body.admin_email = req.body.admin_email.toLowerCase();

    key = "guild:" + utils.generateKey(req.body.guildname);

    db.exists(key, function (err, exists) {
        if (!exists) {
            db.quit();
            return res.send(404);
        }
        db.hmget(key, "guildname", "admin_email", function (err, reply) {
            var new_password = randomPassword(20),
                guildname = reply[0],
                admin_email = reply[1];

            if (req.body.admin_email !== admin_email) {
                return res.send(403);
            }

            bcrypt.hash(new_password, 8, function (err, hash) {
                db.hset(key, "admin_pw", hash);
                db.quit();


                sendEmail(guildname, admin_email, new_password, function (err) {
                    res.send(err ? 500 : 204);
                });
            });
        });
    });
};
