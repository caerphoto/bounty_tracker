<pre>
<?php
include "private.php";

// Run this file once to store NPC data in the database.

$dbh = new PDO($db_conn, $db_user, $db_pw);

// Set up table and sequence stuff for NPC data.
echo $dbh->exec("CREATE TABLE guild_bounty.npcs
(
  name character varying NOT NULL,
  short_name character varying NOT NULL,
  location character varying,
  url character varying,
  id serial NOT NULL,
  CONSTRAINT npcs_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);");

echo $dbh->exec("ALTER TABLE guild_bounty.npcs
  OWNER TO caerpho_guild;");

echo $dbh->exec("CREATE SEQUENCE guild_bounty.guilds_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 7
  CACHE 1;");

echo $dbh->exec("ALTER TABLE guild_bounty.guilds_id_seq
  OWNER TO caerpho_guild;");

echo $dbh->exec("ALTER TABLE guild_bounty.guilds ALTER COLUMN id SET DEFAULT nextval('guild_bounty.guilds_id_seq'::regclass);");

unset($query);

$npc_list = array(
  array(
    "name" => "Ander &ldquo;Wildman&rdquo; Westward",
    "short_name" => "ander",
    "location" => "Southsun Cove",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#1"
  ),
  array(
    "name" => "Bookworm Bwikki",
    "short_name" => "bwikki",
    "location" => "Lornar&rsquo;s Pass",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#2"
  ),
  array(
    "name" => "Brekkabek",
    "short_name" => "brekkabek",
    "location" => "Harathi Hinterlands",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#3"
  ),
  array(
    "name" => "Crusader Michiele",
    "short_name" => "michiele",
    "location" => "Sparkfly Fens",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#4"
  ),
  array(
    "name" => "Deputy Brooke",
    "short_name" => "brooke",
    "location" => "Snowden Drifts",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#5"
  ),
  array(
    "name" => "Devious Teesa",
    "short_name" => "teesa",
    "location" => "Frostgorge Sound",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#6"
  ),
  array(
    "name" => "Diplomat Tarban",
    "short_name" => "tarban",
    "location" => "Brisban Wildlands",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#7"
  ),
  array(
    "name" => "Half-Baked Kamali",
    "short_name" => "kamali",
    "location" => "Mount Maelstrom",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#8"
  ),
  array(
    "name" => "Poobadoo",
    "short_name" => "poobadoo",
    "location" => "Kessex Hills",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#9"
  ),
  array(
    "name" => "Prisoner 1411",
    "short_name" => "1411",
    "location" => "Iron Marches",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#10"
  ),
  array(
    "name" => "Shaman Arderus",
    "short_name" => "arderus",
    "location" => "Fireheart Rise",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#11"
  ),
  array(
    "name" => "Short-Fuse Felix",
    "short_name" => "felix",
    "location" => "Diessa Plateau",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#12"
  ),
  array(
    "name" => "Sotzz the Scallywag",
    "short_name" => "sotzz",
    "location" => "Gendarran Fields",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#13"
  ),
  array(
    "name" => "Tricksy Trekksa",
    "short_name" => "tekksa",
    "location" => "Blazeridge Steppes",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#14"
  ),
  array(
    "name" => "Trillia Midwell",
    "short_name" => "trillia",
    "location" => "Fields of Ruin",
    "url" => "http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/#15"
  )
);

// Insert each NPC into the newly-created table.
foreach ($npc_list as $npc) {
  $query = $dbh->prepare(
    "insert into guild_bounty.npcs (name, location, short_name, url) values " .
    "(:name, :location, :short_name, :url);"
  );
  $data = array();
  foreach ($npc as $key => $value) {
    echo $key . ": " . $value . "\n";
    $data[":" . $key] = $value;
  }
  $query->execute($data);
  unset($query);
}

unset($dbh);

?>
</pre>
