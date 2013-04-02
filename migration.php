<?php
// Database migration script.
// Comment out migrations that have already been performed.

include "private.php";

function createStatsTable() {
  // Create a simple table to track the number of response types returned by each
  // API call.
  global $db_conn, $db_user, $db_pw;
  $dbh = new PDO($db_conn, $db_user, $db_pw);

  echo "Create table: ";
  echo $dbh->exec("CREATE TABLE guild_bounty.stats
  (
    id serial NOT NULL,
    source character varying NOT NULL,
    http200 integer NOT NULL DEFAULT 0,
    http204 integer NOT NULL DEFAULT 0,
    CONSTRAINT stats_pkey PRIMARY KEY (id)
  )
  WITH (
    OIDS=FALSE
  );");

  echo "\nChange owner: ";
  echo $dbh->exec("ALTER TABLE guild_bounty.stats
    OWNER TO caerpho_guild;");

  echo "\nCreate sequence: ";
  echo $dbh->exec("CREATE SEQUENCE guild_bounty.stats_id_seq
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 7
    CACHE 1;");

  echo "\nChange seq owner: ";
  echo $dbh->exec("ALTER TABLE guild_bounty.stats_id_seq
    OWNER TO caerpho_guild;");

  echo "\nSet id to seq: ";
  echo $dbh->exec("ALTER TABLE guild_bounty.stats
    ALTER COLUMN id
    SET DEFAULT nextval('guild_bounty.stats_id_seq'::regclass);");

  echo "\n";
}

function grantCaerphoPrivileges() {

  global $db_conn, $db_user, $db_pw;
  $dbh = new PDO($db_conn, $db_user, $db_pw);
  echo $dbh->exec(
    'GRANT ALL PRIVILEGES ON "guild_bounty"."stats" TO "caerpho";'
  );

  print_r($dbh->errorInfo());
  unset($dbh);
}

//createStatsTable();
//grantCaerphoPrivileges();

?>
