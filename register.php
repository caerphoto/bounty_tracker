<?php
// Handles requests to register guilds.

include "config.php";
include "common.php";

function failValidation($field, $reason) {
  echo json_encode(array($field, $reason));

  return false;
}

function validateRequest(&$params) {
  global $db_conn, $db_user, $db_pw, $required_registration_fields;

  // Default header - will be overriden later if validation passes.
  header("HTTP/1.0 400 Bad Request");

  // Check existence of required field data.
  foreach ($required_registration_fields as $field) {
    if (!isset($params[$field]) || $params[$field] === "") {
      return failValidation($field, "missing");
    }
  }

  // Length check. 100 characters was chosen because it's plenty of space for 
  // almost anything, but not so big as to be unwieldy.
  foreach ($params as $field) {
    if (strlen($field) > 100) {
      return failValidation($field, "length");
    }
  }

  // Check the two given passwords match.
  if ($params["admin_pw"] !== $params["admin_pw_confirm"]) {
    return failValidation("admin_pw", "mismatch");
  }

  // Check for invalid characters in guild name.
  // Valid characters are: [a-z0-9 ]
  $guildname = mb_strtolower($params["name"]);
  if (preg_match("/[^a-z0-9 ]/", $guildname) === 1) {
    return failValidation("name", "invalid");
  }

  // Make sure the guild does not already exist.
  $dbh = new PDO($db_conn, $db_user, $db_pw);
  $query = $dbh->prepare(
    "select name from guild_bounty.guilds where name = :name;"
  );

  $query->bindParam(":name", $guildname);
  $query->execute();
  $results = $query->fetchAll();

  unset($dbh);

  if (count($results) > 0) {
    return failValidation("name", "exists");
  }

  return array(
    "name" => $guildname,
    "admin_email" => mb_strtolower($params["admin_email"]),
    "admin_pw" => $params["admin_pw"],
    "member_pw" => $params["member_pw"]
  );
} // validateRequest()

function createGuild($guild) {
  // Guilty until proven innocent.
  header("HTTP/1.0 500");

  global $db_conn, $db_user, $db_pw, $register_guild_cols;

  $dbh = new PDO($db_conn, $db_user, $db_pw);

  // makeQueryParam is from common.php. It returns ":value" when passed "value".
  $query_params = array_map("makeQueryParam", $register_guild_cols);
  $query_params = join(", ", $query_params);
  $columns = join(", ", $register_guild_cols);

  $query = $dbh->prepare(
    "insert into guild_bounty.guilds (" .
    $columns .
    ") values (" .
    $query_params .
    ");"
  );

  $guild["admin_pw"] = encryptPassword($guild["admin_pw"]);
  // Member password is not encrypted, since they can't really do anything 
  // harmful anyway.

  foreach ($register_guild_cols as $col) {
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
  return fetchGuildData("name", $guild["name"], true);
}

// ==========================
// Main execution begins here
// ==========================

ob_start();

header("Content-type: application/json; charset=UTF-8");

$validatedParams = validateRequest($_REQUEST);

if (!$validatedParams) {
  ob_flush();
  exit(0);
}

$new_guild = createGuild($validatedParams);

if (!$new_guild) {
  ob_flush();
  exit(0);
}

// If we've got this far, everything's ok.
header("HTTP/1.0 200 OK");

session_start();
$_SESSION["admin logged in"] = "yes";
$_SESSION["guild id"] = $new_guild["id"];

echo json_encode($new_guild);

ob_flush();

?>
