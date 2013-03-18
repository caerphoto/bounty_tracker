<?php
// Handles requests to register guilds.

include "../config.php";
include "../lib/common.php";
include "../lib/PasswordHash.php";

function createGuild($guild) {
  // Guilty until proven innocent.
  header("HTTP/1.0 500");

  global $db_conn, $db_user, $db_pw, $create_guild_cols, $admin_guild_cols;

  $dbh = new PDO($db_conn, $db_user, $db_pw);

  // makeQueryParam is from common.php. It returns ":value" when passed "value".
  $query_params = array_map("makeQueryParam", $create_guild_cols);
  $query_params = join(", ", $query_params);
  $columns = join(", ", $create_guild_cols);

  $query = $dbh->prepare(
    "insert into guild_bounty.guilds (" .
    $columns .
    ") values (" .
    $query_params .
    ");"
  );

  $hasher = new PasswordHash(8, false);
  $guild["admin_pw"] = $hasher->HashPassword($guild["admin_pw"]);
  unset($hasher);
  // Member password is not hashed, since they can't really do anything
  // harmful anyway.

  foreach ($create_guild_cols as $col) {
    $query->bindParam(":" . $col, $guild[$col]);
  }

  $result = $query->execute();

  unset($dbh);

  if (!$result) {
    echo "Failed to create guild. Error:\n";
    $error = $query->errorInfo();
    var_dump($error);
    return false;
  }

  // Return actual stored data.
  return fetchGuildData("name", $guild["name"], $admin_guild_cols);
} // createGuild()

ob_start();

header("Content-type: application/json; charset=UTF-8");

// Default header - will be overriden later if validation passes.
header("HTTP/1.0 400 Bad Request");

// Check existence of required field data.
foreach ($required_registration_fields as $field) {
  if (!isset($_REQUEST[$field]) || $_REQUEST[$field] === "") {
    outputError($field, "missing");
    exit;
  }
}

$guildname = $_REQUEST["name"];
// Make sure the guild does not already exist.
if (fetchGuildData("name", $guildname)) {
  outputError("name", "exists");
  exit;
}

if (!validateParams($_REQUEST)) {
  exit;
}

$_REQUEST["admin_email"] = mb_strtolower($_REQUEST["admin_email"]);

$new_guild = createGuild($_REQUEST);

if (!$new_guild) {
  exit;
}

// If we've got this far, everything's ok.
header("HTTP/1.0 200 OK");

session_start();
$_SESSION["admin logged in"] = "yes";
$_SESSION["guild id"] = $new_guild["id"];

$response = array(
  "guild_data" => $new_guild
);
echo json_encode($response);

?>
