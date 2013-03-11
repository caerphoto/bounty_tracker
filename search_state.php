<?php
session_start();
ob_start();
header("Content-Type: application/json");
header("HTTP/1.0 403 Forbidden");

// Abort if not logged in
$guild_id = isset($_SESSION["guild id"]) ? $_SESSION["guild id"] : null;
if (!$guild_id) {
  ob_flush();
  exit(0);
}

include "config.php";
include "common.php";

$state = fetchSearchState($guild_id);

$req_method = isset($_SERVER["REQUEST_METHOD"]) ? $_SERVER["REQUEST_METHOD"] : "GET";
if ($req_method === "GET") {
  // Simplest case: fetch current search state.
  if (!$state) {
    // No state yet, so nothing to return. Note that this isn't an error code.
    header("HTTP/1.0 204 No Content");
  } else {
    header("HTTP/1.0 200 OK");
    echo $state;
  }

  ob_flush();
  exit(0);
}

// Request method is POST, meaning the page is sending a state update.

function createNewState() {
  global $npc_list;

  $new_state = array();
  foreach ($npc_list as $npc) {
    $new_state[$npc["short_name"]] = array(
      "player" => "",
      "found" => false
    );
  }

  return $new_state;
}

if ($state) {
  $state = json_decode($state, true);
} else {
  $state = createNewState();
}

// Update requests must contain the following parameters:
// short_name: the code for the NPC whose state is being updated
// player: the name of the player searching for the NPC
// found: a string either "true" or "false", indicating the NPC's found state

// TODO: validate these params!

$short_name = fix_slashes($_REQUEST["short_name"]);
$player = fix_slashes($_REQUEST["player"]);
if (!$player) {
  $player = "";
}
$found = $_REQUEST["found"] === "true";

$state[$short_name] = array(
  "player" => $player,
  "found" => $found
);

$state = json_encode($state);

$dbh = new PDO($db_conn, $db_user, $db_pw);
$query = $dbh->prepare(
  "update guild_bounty.guilds set search_state=:state where id=:id"
);
$query->bindParam(":state", $state);
$query->bindParam(":id", $guild_id);
$result = $query->execute();

if ($result) {
  header("HTTP/1.0 200 OK");
  echo $state;
} else {
  header("HTTP/1.0 500 Internal Server Error");
  $error = $query->errorInfo();
  echo json_encode($error);
}
?>
