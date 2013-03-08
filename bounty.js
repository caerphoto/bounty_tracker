$(function () {
    "use strict";

    var $body = $(document.body),
        init,
        fetchState,
        postState,
        applyStateToTable;

    init = function () {
        // One-time setup stuff.
        var NPCs = [
                { name: "Ander &ldquo;Wildman&rdquo; Westward",
                    location: "Southsun Cove",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#1" },
                { name: "Bookworm Bwikki",
                    location: "Lornar&rsquo;s Pass",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#2" },
                { name: "Brekkabek",
                    location: "Harathi Hinterlands",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#3" },
                { name: "Crusader Michiele",
                    location: "Sparkfly Fens",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#4" },
                { name: "Deputy Brooke",
                    location: "Snowden Drifts",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#5" },
                { name: "Devious Teesa",
                    location: "Frostgorge Sound",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#6" },
                { name: "Diplomat Tarban",
                    location: "Brisban Wildlands",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#7" },
                { name: "Half-Baked Kamali",
                    location: "Mount Maelstrom",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#8" },
                { name: "Poobadoo",
                    location: "Kessex Hills",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#9" },
                { name: "Prisoner 1411",
                    location: "Iron Marches",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#10" },
                { name: "Shaman Arderus",
                    location: "Fireheart Rise",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#11" },
                { name: "Short-Fuse Felix",
                    location: "Diessa Plateau",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#12" },
                { name: "Sotzz the Scallywag",
                    location: "Gendarran Fields",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#13" },
                { name: "Tricksy Trekksa",
                    location: "Blazeridge Steppes",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#14" },
                { name: "Trillia Midwell",
                    location: "Fields of Ruin",
                    url: "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#15" }
            ],
            $npc_table = $("#npcs"),
            npc_row_template = $("#npc-row-template").html(),
            html;

        $npc_table.html(Mustache.render(npc_row_template, { NPCs: NPCs }));

        // Toggle NPC 'found' status on either button click.
        $npc_table.on("click", "button", function () {
            $(this).closest(".npc-row").toggleClass("found");
            $("#found-count").text($(".npc-row.found").length);
        });
    };

    init();

    $("#register").submit(function () {
        var form = this;

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
            success: function () {
                $body.addClass("logged-in");
                window.location.hash = "";
            },
            error: function (xhr) {
                // I know this is bad UX but it's low priority.
                window.alert(xhr.responseText);
            }
        });

        return false;
    });

});
