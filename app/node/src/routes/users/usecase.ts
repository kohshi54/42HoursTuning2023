import { Target, SearchedUser } from "../../model/types";
import { RowDataPacket } from "mysql2";
import pool from "../../util/mysql";
import {
  getUsersByUserIds,
} from "./repository";

export const getUsersByKeyword = async (
  keyword: string,
  targets: Target[],
  limit: number,
  offset: number
): Promise<SearchedUser[]> => {
  let query = "";
  let args: any[] = [];
  for (const target of targets) {
	if (query != "") { query += " UNION "; }
    switch (target) {
      case "userName":
		query += " (SELECT user_id, entry_date, kana FROM user WHERE MATCH(user_name) AGAINST(? IN BOOLEAN MODE)) ";
		args.push(keyword);
        break;
      case "kana":
		query += " (SELECT user_id, entry_date, kana FROM user WHERE MATCH(kana) AGAINST(? IN BOOLEAN MODE)) ";
		args.push(keyword);
        break;
      case "mail":
		query += " (SELECT user_id, entry_date, kana FROM user WHERE MATCH(mail) AGAINST(? IN BOOLEAN MODE)) ";
		args.push(keyword);
        break;
      case "department":
		query += ` (SELECT user_id, u.entry_date, kana
			FROM
				user AS u  
				JOIN department_role_member AS drm USING(user_id)
				JOIN department AS d USING(department_id)
			WHERE
				department_name LIKE ?
				AND
				drm.belong = true)
				`;
		args.push(`%${keyword}%`);
        break;
      case "role":
		query += ` (SELECT user_id, u.entry_date, kana
			FROM
				user AS u  
				JOIN department_role_member AS drm USING(user_id)
				JOIN role AS r USING(role_Id)
			WHERE
				role_name LIKE ?
				AND
				drm.belong = true)
				`;
		args.push(`%${keyword}%`);
        break;
      case "office":
		query += ` (SELECT user_id, u.entry_date, kana
			FROM
				user AS u  
				JOIN office AS o USING(office_id)
			WHERE
				office_name LIKE ?)
				`;
		args.push(`%${keyword}%`);
        break;
      case "skill":
		query += ` (SELECT user_id, u.entry_date, kana
			FROM
				user AS u  
				JOIN skill_member AS sm USING(user_id)
				JOIN skill AS s USING(skill_id)
			WHERE
				skill_name LIKE ?)
				`;
		args.push(`%${keyword}%`);
        break;
      case "goal":
		query += " (SELECT user_id, entry_date, kana FROM user WHERE MATCH(goal) AGAINST(? IN BOOLEAN MODE)) ";
		args.push(keyword);
        break;
    }
  }
  query = `
  SELECT
  	user_id
  FROM
  	( ${query} ) AS combined
  ORDER BY
  	entry_date ASC, kana ASC
  LIMIT ? OFFSET ? `;
  args.push(limit);
  args.push(offset);
  const [rows] = await pool.query<RowDataPacket[]>(query,args);
  const userIds: string[] = rows.map((row) => row.user_id);
  const users = getUsersByUserIds(userIds);
  return users;
};
