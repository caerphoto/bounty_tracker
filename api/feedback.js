var redis = require("redis"),
    utils = require("../lib/utils");

exports.log = function (req, res) {
    // Logs a feedback message using a unique ID.
    var db,
        msg = req.body.message;

    if (!msg) {
        return res.send(400);
    }

    db = redis.createClient();

    db.incr("feedback:id", function (err, next_id) {
        var key = "feedback:" + next_id;

        db.set(key, msg, function (err) {
            db.quit();

            if (err) {
                utils.log("feedback.log()", err);
                return res.send(500);
            } else {
                utils.log("FEEDBACK", msg.slice(0, 50));
                return res.send(204);
            }
        });
    });

};
