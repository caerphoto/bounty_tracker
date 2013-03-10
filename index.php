<?php
session_start();
header("Content-type: text/html; charset=UTF-8");
include "config.php";
include "common.php";

$body_class = "";
$guild_data = array();

if (isset($_SESSION["member logged in"])) {
  $body_class = "logged-in";
  $guild_data = fetchGuildData("id", $_SESSION["guild id"]);
}

if (isset($_SESSION["admin logged in"])) {
  $body_class = "admin logged-in";
  $guild_data = fetchGuildData("id", $_SESSION["guild id"], $admin_guild_cols);
}

include "main.html";
?>
