<?php

include "config.php";
include "common.php";
include "PasswordHash.php";

ob_start();
session_start();

//header("Content-Type: application/json");
header("Content-Type: text/html");
header("HTTP/1.0 403 Forbidden");

if (!isset($_SESSION["guild id"])) {
  exit;
}


if (!isset($_SESSION["admin logged in"])) {
  exit;
}

$guild = fetchGuildData("id", $_SESSION["guild id"]);

if (!$guild) {
  exit;
}

header("HTTP/1.0 400 Bad Request");

if (!validateParams($_REQUEST)) {
  exit;
}

$cols_to_update = array();

if (isset($_REQUEST["admin_email"])) {
  $cols_to_update["admin_email"] = mb_strtolower($_REQUEST["admin_email"]);
}

if (isset($_REQUEST["member_pw"])) {
  $cols_to_update["member_pw"] = $_REQUEST["member_pw"];
}

if (isset($_REQUEST["admin_pw"]) && $_REQUEST["admin_pw"] !== "") {
  $hasher = new PasswordHash(8, false);
  $hashed_password = $hasher->HashPassword($_REQUEST["admin_pw"]);
  $cols_to_update["admin_pw"] = $hashed_password;
}

// Just in case something goes wrong.
header("HTTP/1.0 500 Internal Server Error");
$result = updateGuildData($guild["id"], $cols_to_update);

if (!$result) {
  exit;
}

// Perhaps a bit paranoid?
header("HTTP/1.0 404 Not Found");
$updated_guild_data = fetchGuildData("id", $guild["id"], $update_info_cols);

header("HTTP/1.0 200 OK");
echo json_encode($updated_guild_data);
?>
