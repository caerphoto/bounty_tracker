var redis = require("redis"),
    utils = require("../lib/utils"),
    mailer = require("nodemailer").createTransport("sendmail", {
        path: "/usr/sbin/sendmail"
    });

exports.log = function (req, res) {
    // Logs a feedback message using a unique ID.
    var db,
        msg = req.body.message,
        contact = req.body.contact || "<anonymous>";

    if (!msg) {
        return res.send(400);
    }

    db = redis.createClient();

    db.incr("feedback-id", function (err, next_id) {
        var key = "feedback:" + next_id;

        db.set(key, [msg, contact].join("\t"), function (err) {
            db.quit();

            mailer.sendMail({
                from: contact || "<anonymous>",
                to: "andy@caer.me",
                subject: "Bounty Tracker feedback",
                text: msg
            }, function (mail_err) {
                if (mail_err) {
                    console.log("Feedback mail error:" + mail_err);
                }
            });

            if (err) {
                utils.log("feedback.log()", err);
                return res.send(500);
            } else {
                utils.log("FEEDBACK", contact, msg.slice(0, 50));
                return res.send(204);
            }
        });
    });

};
