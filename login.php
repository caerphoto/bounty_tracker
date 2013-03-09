<?php

include "config.php";
include "common.php";

ob_start();

header("Content-Type: application/json");
header("HTTP/1.0 403 Forbidden");

$guildname = $_REQUEST["guildname"];
$password = $_REQUEST["password"];
$encrypted_password = encryptPassword($password);

$guild = fetchGuildData("name", $guildname, true);

if (!$guild) {
  header("HTTP/1.0 404 Not Found");
  ob_flush();
  exit(0);
}

if ($encrypted_password === $guild["admin_pw"]) {
  session_start();

  header("HTTP/1.0 200 OK");
  $_SESSION["admin logged in"] = "yes";
  $_SESSION["guild id"] = $guild["id"];

  $response = array();
  foreach ($admin_guild_cols as $col) {
    $response[$col] = $guild[$col];
  }

  echo json_encode($response);

  ob_flush();
  exit(0);
}

if ($password === $guild["member_pw"]) {
  session_start();

  header("HTTP/1.0 200 OK");
  $_SESSION["member logged in"] = "yes";
  $_SESSION["guild id"] = $guild["id"];

  $response = array();
  foreach ($member_guild_cols as $col) {
    $response[$col] = $guild[$col];
  }

  echo json_encode($response);

  ob_flush();
  exit(0);
}

print_r($guild);
echo "\nProvided password: " . $password . "\n";
echo "Encrypted password: " . $encrypted_password . "\n";
ob_flush();
?>
