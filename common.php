<?php
function makeQueryParam($value) {
  // Very simple function, generally used with array_map
  return ":" . $value;
};

function fetchGuildData($col, $term, $admin) {
  // Returns id, name and member password based on the given search info
  // $col: which column to match against
  // $term: the data in $col to match against
  // $admin: if true, also returns admin email and (encrypted) password.
  global $db_conn, $db_user, $db_pw, $admin_guild_cols, $member_guild_cols;

  $dbh = new PDO($db_conn, $db_user, $db_pw);

  if ($admin) {
    $select_cols = $admin_guild_cols;
  } else {
    $select_cols = $member_guild_cols;
  }

  $query = $dbh->prepare(
    "select ".
    join(", ", $select_cols) .
    " from guild_bounty.guilds" .
    " where " . $col . " = :" . $col
  );

  $query->bindParam(":" . $col, $term);

  $result = $query->execute();
  unset($dbh);

  if (!$result) {
    //header('HTTP/1.0 404 Not Found');
    //$error = $query->errorInfo();
    //var_dump($error);
    return false;
  } else {
    return $query->fetch(PDO::FETCH_ASSOC);
  }

}

function encryptPassword($pw) {
  // Returns the encrypted version of the given password string.
  // TODO: encryption *cough*
  return $pw;
}

?>
