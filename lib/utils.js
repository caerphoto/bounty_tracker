"use strict";

exports.createNewState = function () {
    var npc_list = require("./npc_data").list,
        new_state = {};

    npc_list.forEach(function (npc) {
        new_state[npc.short_name] = {
            players: [],
            found: false
        };
    });

    return new_state;
};

exports.validateParams = function (params) {
    Object.keys(params).forEach(function (key) {
        if (params[key].length > 70) {
            return [key, "length"];
        }
    });

    if (params.admin_pw && !params.admin_pw_confirm) {
        return ["admin_pw_confirm", "missing"];
    }

    if (params.admin_pw !== params.admin_pw_confirm) {
        return ["admin_pw_confirm", "mismatch"];
    }

    return true;
};

exports.generateKey = function (guildname) {
    // Create a key for the guild by converting its name to lower case and
    // namespacing it.
    // node_redis takes care of escaping doublequote characters automatically.
    return "guild:" + guildname.toLowerCase();
};

exports.recordLogin = function (guild_key) {
    var redis = require("redis"),
        db = redis.createClient(),
        multi = db.multi();

    multi.hset("login-data:" + guild_key, "time", Date.now());
    multi.hincrby("login-data:" + guild_key, "count", 1);
    multi.exec();
    db.quit();
};

exports.each = function (obj, iterator, context) {
    // Calls 'iterator' with each value and key of the given object.
    // Based on the implementation in underscore.js.
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (iterator.call(context, obj[key], key, obj) === false) {
                return;
            }
        }
    }
};
