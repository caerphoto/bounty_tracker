<?php
session_start();
header("Content-type: text/html; charset=UTF-8");
ob_start("ob_gzhandler");

include "config.php";
include "lib/common.php";

$body_class = "";
$guild_data = false;
$default_search_state = json_encode(createNewState());
$search_state = $default_search_state;

if (isset($_SESSION["member logged in"])) {
  $body_class = "logged-in";
  $guild_data = fetchGuildData("id", $_SESSION["guild id"]);
  $search_state = fetchSearchState($_SESSION["guild id"]);
  if (!$search_state) {
    $search_state = $default_search_state;
  }
}

if (isset($_SESSION["admin logged in"])) {
  $body_class = "admin logged-in";
  $guild_data = fetchGuildData("id", $_SESSION["guild id"], $admin_guild_cols);
  $search_state = fetchSearchState($_SESSION["guild id"]);
  if (!$search_state) {
    $search_state = $default_search_state;
  }
}

include "main.php";
?>
