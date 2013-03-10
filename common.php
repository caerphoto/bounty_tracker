<?php
function makeQueryParam($value) {
  // Very simple function, generally used with array_map
  return ":" . $value;
};

function fetchGuildData($col, $term, $select_cols=array("id", "name")) {
  // Returns id, name and member password based on the given search info
  // $col: which column to match against
  // $term: the data in $col to match against
  global $db_conn, $db_user, $db_pw;

  $dbh = new PDO($db_conn, $db_user, $db_pw);

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

?>
