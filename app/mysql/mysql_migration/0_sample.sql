ALTER TABLE department_role_member ADD INDEX user_id_idx(user_id);
ALTER TABLE match_group_member ADD INDEX user_id_idx(user_id);
ALTER TABLE department_role_member ADD INDEX role_id_idx(role_id);
ALTER TABLE user ADD FULLTEXT INDEX ngram_idx (goal) WITH PARSER ngram;
