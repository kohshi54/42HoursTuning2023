ALTER TABLE department_role_member ADD INDEX user_id_idx(user_id);
ALTER TABLE match_group_member ADD INDEX user_id_idx(user_id);
ALTER TABLE department_role_member ADD INDEX role_id_idx(role_id);
ALTER TABLE user ADD FULLTEXT INDEX ngram_idx (goal) WITH PARSER ngram;

ALTER TABLE user ADD FULLTEXT INDEX ngram_idx (user_name) WITH PARSER ngram;
ALTER TABLE user ADD FULLTEXT INDEX ngram_idx (mail) WITH PARSER ngram;
ALTER TABLE user ADD FULLTEXT INDEX ngram_idx (kana) WITH PARSER ngram;
ALTER TABLE user ADD INDEX mail_idx(mail);
