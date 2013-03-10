<?php

include "config.php";
include "common.php";
include "PasswordHash.php";

ob_start();

header("Content-Type: application/json");
header("HTTP/1.0 403 Forbidden");

$guildname = $_REQUEST["guildname"];
$password = $_REQUEST["password"];

$guild = fetchGuildData("name", $guildname, true);

if (!$guild) {
  ob_flush();
  exit(0);
}

$hasher = new PasswordHash(8, false);
$is_admin_password = $hasher->CheckPassword($password, $guild["admin_pw"]);
unset($hasher);

if ($is_admin_password) {
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
