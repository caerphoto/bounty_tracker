/*jshint jquery: true, browser: true*/
/*global GBT, Mustache, soundManager*/
$(function () {
    "use strict";

    var $body = $(document.body),
        $npc_table = $("#npcs"),
        $manual_refresh = $("#manual-refresh"),
        $error = $("#error"),
        error_template = $("#error-template").html(),

        player_list_template = $("#player-list-template").html(),

        min_sync_interval = 5000, // miniumum time in ms between sync requests
        sync_interval = min_sync_interval,
        sync_timer, // handle returned by setTimeout()

        idle_time,
        idle_timer,

        prev_text,
        row_timer, // for slightly delaying sync on keyboard input

        has_played_sound = false,

        base_doc_title = document.title,

        error_messages = {
            "exists": "A guild with that name has already been registered.",
            "missing": "The <em>%s</em> field cannot be left blank.",
            "length": "The <em>%s</em> field cannot be longer than <em>%d</em> characters.",
            "mismatch": "The <em>%s</em> does not match.",
            "invalid": "The <em>%s</em> contains invalid characters."
        },
        field_names = {
            "guildname": "guild name",
            "admin_pw": "admin password",
            "admin_email": "admin email",
            "admin_pw_confirm": "admin password confirmation",
            "member_pw": "member password"
        },

        initTable,
        errorDialog,
        fetchState,
        postState,
        applyState,
        beginAutoSync,
        logIn,
        updateRow,
        incrementIdleTime;

    initTable = function () {
        // One-time setup stuff.
        var npc_row_template = $("#npc-row-template").html();

        $npc_table.html(Mustache.render(npc_row_template, { NPCs: GBT.npc_list }));

    };

    errorDialog = function (view) {
        $error.html(Mustache.render(error_template, view));
        window.location.hash = "error-dialog";
        $error.find("a.button").get(0).focus();
    };

    fetchState = function (callback) {
        $.ajax({
            url: "api/search_state",
            type: "GET",
            dataType: "json",
            success: function (response) {
                // Server may return HTTP 204, indicating success but that the
                // state has not changed since the previous request.
                if (response) {
                    GBT.search_state = response;
                    applyState();
                }
                if (typeof callback === "function") {
                    callback(true);
                }
            },
            error: function () {
                if (typeof callback === "function") {
                    callback(false);
                }
            }
        });

    };

    applyState = function () {
        var count = 0,
            state = GBT.search_state,
            is_admin = GBT.is_admin;

        $.each(state, function (short_name, status) {
            var $row = $("#npc-" + short_name),
                $list;

            if (status.found) {
                count += 1;
            }

            $row.toggleClass("found", status.found);

            if (is_admin) {
                // Only apply input box updates if they don't have focus
                $list = $row.find(".player-names .names-editor");
                if (!$list.is(":focus")) {
                    // Backwards-compatibility with old-style status that could
                    // only store a string.
                    if (status.player.charAt) {
                        $list.val(status.player);
                    } else {
                        $list.val(status.player.join(", "));
                    }
                }
            } else {
                $list = $row.find(".player-names .player-list");

                if (!status.player) {
                    $list.html("");
                    return;
                }

                if (status.player.charAt) {
                    status.player = status.player.split(",");
                }
                $list.html(Mustache.render(player_list_template, {
                    players: status.player
                }));
            }
        });

        if (count >= GBT.npc_list.length) {
            if (!has_played_sound) {
                soundManager.play("all_found");
                has_played_sound = true;
            }
        } else {
            has_played_sound = false;
        }

        $("#found-count").text(count);
        document.title = "(" + count + ") " + base_doc_title;
    };

    postState = function (short_name, players, found, callback) {
        if ($body.hasClass("demo")) {
            // Don't send updates to the server, since they'll get rejected
            // anyway.
            GBT.search_state[short_name].players = players;
            GBT.search_state[short_name].found = found;
            applyState();
            callback(true);
            return;
        }

        $.ajax({
            url: "api/search_state",
            type: "POST",
            data: {
                short_name: short_name,
                players: JSON.stringify(players || []),
                found: !!found
            },
            dataType: "json",
            success: function (response) {
                GBT.search_state = response;
                applyState();

                if (typeof callback === "function") {
                    callback(true);
                }
            },
            error: function (xhr) {
                if (typeof callback === "function") {
                    callback(false, xhr.responseText);
                }
            }
        });
    };

    beginAutoSync = function () {
        if ($body.hasClass("demo")) {
            return;
        }

        if (!idle_timer) {
            idle_time = 0;
            idle_timer = setInterval(incrementIdleTime, 600000); // 10 minutes
        }

        fetchState(function (success) {
            // If successful, reduce sync interval until at minimum, otherwise
            // double it. The idea is to be tolerant of network problems.
            if (success) {
                if (sync_interval > min_sync_interval) {
                    sync_interval = sync_interval / 2;
                }
            } else {
                sync_interval = sync_interval * 2;
            }

            if (document.getElementById("toggle-autosync").checked) {
                sync_timer = setTimeout(beginAutoSync, sync_interval);
            }
        });
    };

    logIn = function () {
        $body.removeClass("demo logged-out");
        $body.addClass("logged-in");
        if (GBT.is_admin) {
            $body.addClass("admin");
        }
        window.location.hash = "";

        $("#logged-in-guildname").text(GBT.guild_data.guildname);
        $("#options-member-pw").val(GBT.guild_data.member_pw);
        $("#options-admin-email").val(GBT.guild_data.admin_email);

        $("#login-guildname").get(0).blur();
        $("#login-password").get(0).blur();

        if (GBT.search_state) {
            applyState();
        }

        setTimeout(function () {
            beginAutoSync();
        }, sync_interval);
    };

    $("#register").on("submit", function () {
        // Override form submit handling to use ajax instead.
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                guildname: form.guildname.value,
                admin_email: form.admin_email.value,
                admin_pw: form.admin_pw.value,
                admin_pw_confirm: form.admin_pw_confirm.value,
                member_pw: form.member_pw.value
            },
            dataType: "json",
            success: function (response) {
                GBT.guild_data = response.guild_data;
                logIn(true);

                // TODO: change this to something less terrible
                window.alert("Success!");
            },
            error: function (xhr) {
                var error = JSON.parse(xhr.responseText),
                    view = {
                        message: error_messages[error[1]],
                        code: xhr.status,
                        prev_location: window.location.hash
                    };

                view.message = view.message.replace("%s", field_names[error[0]]);
                view.message = view.message.replace("%d", error[2]);

                errorDialog(view);
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false; // prevent default handling of form submission
    });

    $("#login").on("submit", function () {
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                guildname: form.guildname.value,
                password: form.password.value
            },
            dataType: "json",
            success: function (response) {
                GBT.guild_data = response.guild_data;
                GBT.is_admin = response.is_admin;
                GBT.search_state = response.search_state;
                logIn();
                form.password.value = "";
            },
            error: function (xhr) {
                var view = {
                    message: "Invalid guild name or password.",
                    code: xhr.status,
                    prev_location: "#"
                };

                if (xhr.status === 403) {
                    errorDialog(view);
                } else {
                    // I know this is bad UX but it's low priority, since it's
                    // unlikely to happen anyway.
                    window.alert(xhr.status + " " + xhr.statusText);
                }
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false;
    });

    $("#log-out").on("click", function () {
        var $button = $(this);

        $button.addClass("working");

        $.ajax({
            url: "api/logout",
            type: "POST",
            success: function () {
                $body.removeClass("admin logged-in");
                $body.addClass("logged-out");
                window.location.hash = "";
                clearTimeout(sync_timer);
                document.title = base_doc_title;
                GBT.guild_data = false;
            },
            error: function (xhr) {
                // I hope this never happens. It shouldn't, right?
                window.alert(xhr.statusCode());
            },
            complete: function () {
                $button.removeClass("working");
            }
        });
    });

    $("#reset-password").on("submit", function () {
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                guildname: form.guildname.value,
                admin_email: form.admin_email.value
            },
            dataType: "json",
            success: function () {
                window.location.hash = "";
                window.alert("Your password has been reset. Please check your email.");
            },
            error: function (xhr) {
                var view = {
                    code: xhr.status,
                    prev_location: "#forgot-password-dialog"
                },
                messages = {
                    "400": "Neither field can be left blank.",
                    "403": "Incorrect email address.",
                    "404": "No guild found called <em>%s</em>."
                };

                if (messages[xhr.status.toString()]) {
                    view.message = messages[xhr.status.toString()].
                        replace("%s", form.guildname.value);
                    errorDialog(view);
                } else {
                    // Should not happen, so use basic browser alert.
                    window.alert(xhr.status + " " + xhr.statusText);
                }
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false;
    });

    $("#options").on("submit", function () {
        var form = this,
            $submit_button = $(form).find('input[type="submit"]'),
            data = {};

        $submit_button.addClass("working");

        // Only send field data if they're not blank.
        if (form.member_pw.value) {
            data.member_pw = form.member_pw.value;
        }
        if (form.admin_email.value) {
            data.admin_email = form.admin_email.value;
        }
        if (form.admin_pw.value) {
            data.admin_pw = form.admin_pw.value;
            data.admin_pw_confirm = form.admin_pw_confirm.value;
        }

        $.ajax({
            url: form.action,
            type: form.method,
            data: data,
            dataType: "json",
            success: function (response) {
                GBT.guild_data.member_pw = response.member_pw;
                GBT.guild_data.admin_email = response.admin_email;

                form.admin_pw.value = "";
                form.admin_pw_confirm.value = "";

                window.location.hash = "";
            },
            error: function (xhr) {
                var error = JSON.parse(xhr.responseText),
                    view = {
                        message: error_messages[error[1]],
                        code: xhr.status,
                        prev_location: window.location.hash
                    };

                view.message = view.message.replace("%s", field_names[error[0]]);
                view.message = view.message.replace("%d", error[2]);

                errorDialog(view);
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false;
    });

    $(window).on("hashchange", function () {
        // Generic dialog input box focusser thing.
        var hash = window.location.hash,
            $input;

        if (!hash || hash === "#") {
            return;
        }

        $input = $(hash + " > form > input").first();
        $input.get(0).focus();
    });

    $("#demo-toggle").on("click", function () {
        $body.toggleClass("demo");
        if (!$body.hasClass("demo")) {
            document.title = base_doc_title;
        }
    });

    updateRow = function ($row, found) {
        var $buttons = $row.find("button");

        $buttons.addClass("working");

        postState(
            $row.attr("id").slice(4), // short_name
            $row.find(".player-names .names-editor").val().split(","),
            found,
            function () {
                $buttons.removeClass("working");
            }
        );
    };

    // Toggle NPC 'found' status on either button click.
    $npc_table.on("click", ".npc-controls button", function () {
        var $button = $(this);
        updateRow($button.closest(".npc-row"), $button.hasClass("found"));

    }).on("keydown", ".player-names .names-editor", function () {
        var input = this,
            $row = $(this).closest(".npc-row");

        if (row_timer) {
            clearTimeout(row_timer);
        }

        // Delay posting update for a bit to avoid spamming server for every
        // single keypress. Also only update if text has changed (so not on
        // presses of arrow keys etc.).
        if (prev_text && this.value !== prev_text) {
            row_timer = setTimeout(function () {
                updateRow($row, $row.hasClass("found"));
            }, 500);
        }
        prev_text = input.value;

    }).on("blur", ".player-name input", function () {
        var $row = $(this).closest(".npc-row");
        updateRow($row, $row.hasClass("found"));
    });

    $("#toggle-autosync").on("change", function () {
        $manual_refresh.toggleClass("disabled", this.checked);
        if (this.checked) {
            beginAutoSync();
        } else {
            clearTimeout(sync_timer);
        }
    });

    $manual_refresh.on("click", function () {
        fetchState();
    });

    $("#reset").on("click", function () {
        var $button = $(this);
        $button.addClass("working");

        postState("__ALL__", "", false, function () {
            $button.removeClass("working");
            $(".npc-row").removeClass("found");
            $npc_table.find("input").val("");
        });
    });

    // Idle timer: disable auto-sync if no activity for 3 hours.
    $body.on("mousemove keyup", function () {
        idle_time = 0;
    });

    incrementIdleTime = function () {
        idle_time += 1; // Timer is incremented every 10 minutes.
        if (idle_time >= 18) { // 3 hours (3 x 10 mins)
            clearTimeout(sync_timer);
            idle_timer = clearTimeout(idle_timer);
            $("#toggle-autosync").get(0).checked = false;
        }
    };

    soundManager.setup({
        url: "/media/soundmanager2.swf",
        onready: function () {
            // SM2 is ready to play audio!
            soundManager.createSound({
                id: "all_found",
                url: "/media/all_found.mp3"
            });
        }
    });

    initTable();

    if (GBT.guild_data && GBT.search_state) {
        applyState(GBT.search_state);
    }

    // Start sync if user appears to be logged in.
    if (GBT.guild_data) {
        beginAutoSync();
    }

    // FOR TESTING ONLY. REMOVE IN PRODUCTION!!!111
    $("#found-display").on("click", function () {
        $body.toggleClass("admin");
        $body.toggleClass("member");
    });

});
