/*jslint node: true, devel: true*/
exports.createNewState = function () {
    "use strict";

    var npc_list = require("./npc_data").list,
        new_state = {};

    npc_list.forEach(function (npc) {
        new_state[npc.short_name] = {
            player: "",
            found: false
        };
    });

    return new_state;
};

exports.validateParams = function (params) {
    "use strict";
    var guildname;

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
    "use strict";
    // Create a key for the guild by converting its name to lower case and
    // namespacing it.
    // node_redis takes care of escaping doublequote characters automatically.
    return "guild:" + guildname.toLowerCase();
};
