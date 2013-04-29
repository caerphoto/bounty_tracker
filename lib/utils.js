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

exports.dateToStr = function (date) {
    // Convert a date to `yyyy-mm-dd hh:MM` format.
    var d, t, h, m, s;

    m = date.getUTCMonth() + 1,
    t = date.getUTCDate();
    d = [
        date.getUTCFullYear(),
        m < 10 ? "0" + m : m,
        t < 10 ? "0" + t : t
    ].join("-");

    h = date.getUTCHours();
    m = date.getUTCMinutes();
    s = date.getUTCSeconds();

    t = [
        h < 10 ? "0" + h : h,
        m < 10 ? "0" + m : m,
        s < 10 ? "0" + s : s
    ].join(":");

    return [
        d,
        t
    ].join(" ");
};

exports.log = function () {
    var timestamp = new Date().toISOString(),
        msg = Array.prototype.join.call(arguments, "\t");
    return console.log(timestamp + "\t" + msg);
};
