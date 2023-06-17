ALTER TABLE department_role_member ADD INDEX user_id_idx(user_id);
ALTER TABLE match_group_member ADD INDEX user_id_idx(user_id);
ALTER TABLE department_role_member ADD INDEX role_id_idx(role_id);
ALTER TABLE user ADD FULLTEXT INDEX ngram_goal_idx (goal) WITH PARSER ngram;
ALTER TABLE user ADD FULLTEXT INDEX ngram_user_name_idx (user_name) WITH PARSER ngram;
ALTER TABLE user ADD FULLTEXT INDEX ngram_mail_idx (mail) WITH PARSER ngram;
ALTER TABLE user ADD FULLTEXT INDEX ngram_kana_idx (kana) WITH PARSER ngram;
ALTER TABLE user ADD INDEX mail_idx(mail);
ALTER TABLE user ADD INDEX entry_date_kana_idx(entry_date, kana);
