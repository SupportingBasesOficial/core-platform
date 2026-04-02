create table if not exists dead_events (
  like events including all
);