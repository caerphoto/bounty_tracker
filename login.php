<?php

include "config.php";
include "common.php";
include "PasswordHash.php";

ob_start();

header("Content-Type: application/json");
header("HTTP/1.0 403 Forbidden");

$guildname = $_REQUEST["guildname"];
$password = $_REQUEST["password"];

$guild = fetchGuildData("name", $guildname, $login_check_cols);

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
  $guild_data = array();
  foreach ($admin_guild_cols as $col) {
    $guild_data[$col] = $guild[$col];
  }
  $response["is_admin"] = true;
  $response["guild_data"] = $guild_data;
  $response["search_state"] = fetchSearchState($guild["id"], true);

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
  $guild_data = array();
  foreach ($member_guild_cols as $col) {
    $guild_data[$col] = $guild[$col];
  }
  $response["is_admin"] = false;
  $response["guild_data"] = $guild_data;
  $response["search_state"] = fetchSearchState($guild["id"], true);

  echo json_encode($response);

  ob_flush();
  exit(0);
}

ob_flush();
?>
