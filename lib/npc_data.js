var npcs = [
  // New NPCs added 2013-04-03.
  {
    "name": "2-MULT",
    "short_name": "twomult",
    "location": "Timberline Falls",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#0"
  },
  {
    "name": "Big Mayana",
    "short_name": "mayana",
    "location": "Sparkfly Fen",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#1b"
  },
  {
    "name": "Yanonka the Rat-Wrangler",
    "short_name": "yanonka",
    "location": "Fields of Ruin",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#16"
  },

  // Original NPCs.
  {
    "name": "Ander &ldquo;Wildman&rdquo; Westward",
    "short_name": "ander",
    "location": "Southsun Cove",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#1"
  },
  {
    "name": "Bookworm Bwikki",
    "short_name": "bwikki",
    "location": "Lornar&rsquo;s Pass",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#2"
  },
  {
    "name": "Brekkabek",
    "short_name": "brekkabek",
    "location": "Harathi Hinterlands",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#3"
  },
  {
    "name": "Crusader Michiele",
    "short_name": "michiele",
    "location": "Sparkfly Fens",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#4"
  },
  {
    "name": "Deputy Brooke",
    "short_name": "brooke",
    "location": "Snowden Drifts",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#5"
  },
  {
    "name": "Devious Teesa",
    "short_name": "teesa",
    "location": "Frostgorge Sound",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#6"
  },
  {
    "name": "Diplomat Tarban",
    "short_name": "tarban",
    "location": "Brisban Wildlands",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#7"
  },
  {
    "name": "Half-Baked Kamali",
    "short_name": "kamali",
    "location": "Mount Maelstrom",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#8"
  },
  {
    "name": "Poobadoo",
    "short_name": "poobadoo",
    "location": "Kessex Hills",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#9"
  },
  {
    "name": "Prisoner 1411",
    "short_name": "1411",
    "location": "Iron Marches",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#10"
  },
  {
    "name": "Shaman Arderus",
    "short_name": "arderus",
    "location": "Fireheart Rise",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#11"
  },
  {
    "name": "Short-Fuse Felix",
    "short_name": "felix",
    "location": "Diessa Plateau",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#12"
  },
  {
    "name": "Sotzz the Scallywag",
    "short_name": "sotzz",
    "location": "Gendarran Fields",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#13"
  },
  {
    "name": "Tricksy Trekksa",
    "short_name": "tekksa",
    "location": "Blazeridge Steppes",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#14"
  },
  {
    "name": "Trillia Midwell",
    "short_name": "trillia",
    "location": "Fields of Ruin",
    "url": "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#15"
  }
];

npcs.sort(function (a, b) {
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
});

exports.list = npcs;