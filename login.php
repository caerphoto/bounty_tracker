<?php

include "config.php";
include "common.php";

ob_start();

header("Content-Type: application/json");
header("HTTP/1.0 403 Forbidden");

$guildname = $_REQUEST["guildname"];
$password = $_REQUEST["password"];

$hasher = new PasswordHash(8, false);
$hashed_password = $hasher->HashPassword($password);
unset($hasher);

$guild = fetchGuildData("name", $guildname, true);

if (!$guild) {
  header("HTTP/1.0 404 Not Found");
  ob_flush();
  exit(0);
}

if ($hashed_password === $guild["admin_pw"]) {
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

ob_flush();
?>
