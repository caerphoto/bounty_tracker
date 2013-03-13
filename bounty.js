/*global GBT, soundManager */
$(function () {
    "use strict";

    var $body = $(document.body),
        $npc_table = $("#npcs"),
        $manual_refresh = $("#manual-refresh"),

        min_sync_interval = 4000, // miniumum time in ms between sync requests
        sync_interval = min_sync_interval,
        sync_timer, // handle returned by setTimeout()

        idle_time,
        idle_timer,

        prev_text,
        row_timer, // for slightly delaying sync on keyboard input

        has_played_sound = false,

        base_doc_title = document.title,

        initTable,
        fetchState,
        postState,
        applyState,
        beginAutoSync,
        logIn,
        updateRow,
        incrementIdleTime;

    initTable = function () {
        // One-time setup stuff.
        var npc_row_template = $("#npc-row-template").html(),
            html;

        $npc_table.html(Mustache.render(npc_row_template, { NPCs: GBT.npc_list }));

    };

    fetchState = function (callback) {
        $.ajax({
            url: "search_state.php",
            type: "GET",
            dataType: "json",
            success: function (response) {
                if (response) {
                    GBT.search_state = response;
                    applyState();
                }
                if (typeof callback === "function") {
                    callback(true);
                }
            },
            error: function (xhr) {
                if (typeof callback === "function") {
                    callback(false);
                }
            }
        });

    };

    applyState = function () {
        var count = 0,
            state = GBT.search_state;

        $.each(state, function (short_name, status) {
            var $row = $("#npc-" + short_name),
                $input;
            if (status.found) {
                count += 1;
            }
            $row.toggleClass("found", status.found);

            // Only apply input box updates if they don't have focus
            $input = $row.find(".player-name input");
            if (!$input.is(":focus")) {
                $input.val(status.player);
            }
        });

        if (count >= 15) {
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

    postState = function (short_name, player, found, callback) {
        if ($body.hasClass("demo")) {
            // Don't send updates to the server, since they'll get rejected
            // anyway.
            GBT.search_state[short_name].player = player;
            GBT.search_state[short_name].found = found;
            applyState();
            callback(true);
            return;
        }

        $.ajax({
            url: "search_state.php",
            type: "POST",
            data: {
                short_name: short_name,
                player: player || "",
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

    logIn = function (is_admin) {
        $body.removeClass("demo");
        $body.addClass("logged-in");
        if (is_admin) {
            $body.addClass("admin");
        }
        window.location.hash = "";

        $("#logged-in-guildname").text(GBT.guild_data.name);
        $("#options-member-pw").val(GBT.guild_data.member_pw);
        $("#options-admin-email").val(GBT.guild_data.admin_email);

        if (GBT.search_state) {
            applyState();
        }

        beginAutoSync();
    };

    $("#register").submit(function () {
        // Override form submit handling to use ajax instead.
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                name: form.guildname.value,
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
                // I know this is bad UX but it's low priority.
                window.alert(xhr.responseText);
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false; // prevent default handling of form submission
    });

    $("#login").submit(function () {
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
                GBT.search_state = response.search_state;
                logIn(response.is_admin);
                form.password.value = "";
            },
            error: function (xhr) {
                if (xhr.status === 403) {
                    window.alert("Invalid guild name or password.");
                } else {
                    // I know this is bad UX but it's low priority.
                    window.alert(xhr.status + " " + xhr.statusText);
                }
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false;
    });

    $("#log-out").click(function () {
        var $button = $(this);

        $button.addClass("working");

        $.ajax({
            url: "logout.php",
            type: "POST",
            success: function () {
                $body.removeClass("admin logged-in");
                window.location.hash = "";
                clearTimeout(sync_timer);
                document.title = base_doc_title;
            },
            error: function (xhr) {
                // I know this is bad UX but it's low priority.
                window.alert(xhr.statusCode());
            },
            complete: function () {
                $button.removeClass("working");
            }
        });
    });

    $("#reset-password").submit(function () {
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                admin_email: form.admin_email.value
            },
            dataType: "json",
            success: function (response) {
                window.location.hash = "";
                window.alert("Your password has been reset. Please check your email.");
            },
            error: function (xhr) {
                if (xhr.status === 404) {
                    window.alert("Couldn't find a guild named\n\n" +
                        form.guildname.value + "'");
                } else {
                    // I know this is bad UX but it's low priority.
                    window.alert(xhr.status + " " + xhr.statusText);
                }
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false;
    });

    $("#options").submit(function () {
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
                window.alert("Unable to save options.\n\n" +
                    "Error " + xhr.status + ": " + xhr.statusText);
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
        $input.focus();
    });

    $("#demo-toggle").click(function () {
        $body.toggleClass("demo");
        if (!$body.hasClass("demo")) {
            document.title = base_doc_title;
        }
    });

    updateRow = function ($row, found) {
        var $buttons = $row.find("button");

        $buttons.addClass("working");

        // Pause sync until this request has completed.
        clearTimeout(sync_timer);

        postState($row.attr("id").slice(4),
            $row.find(".player-name input").val(),
            found,
            function (success, error_message) {
                $buttons.removeClass("working");
                sync_timer = setTimeout(beginAutoSync, sync_interval);
            }
        );
    };

    // Toggle NPC 'found' status on either button click.
    $npc_table.on("click", "button", function () {
        var $button = $(this);
        updateRow($button.closest(".npc-row"), $button.hasClass("found"));
    }).on("keydown", ".player-name input", function () {
        // Delay posting update for a bit to avoid spamming server for every
        // single keypress. Also only update if text has changed (so not on
        // presses of arrow keys etc.).
        var input = this,
            $row = $(this).closest(".npc-row");

        if (row_timer) {
            clearTimeout(row_timer);
        }

        if (prev_text && this.value !== prev_text) {
            row_timer = setTimeout(function () {
                updateRow($row, $row.hasClass("found"));
            }, 300);
        }
        prev_text = input.value;
    }).on("blur", ".player-name input", function () {
        var $row = $(this).closest(".npc-row");
        updateRow($row, $row.hasClass("found"));
    });

    $("#toggle-autosync").change(function () {
        $manual_refresh.toggleClass("disabled", this.checked);
        if (this.checked) {
            beginAutoSync();
        } else {
            clearTimeout(sync_timer);
        }
    });

    $manual_refresh.click(function () {
        fetchState();
    });

    $("#reset").click(function () {
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
        url: "lib/soundmanager2.swf",
        onready: function () {
            // SM2 is ready to play audio!
            soundManager.createSound({
                id: "all_found",
                url: "all_found.mp3"
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

});
