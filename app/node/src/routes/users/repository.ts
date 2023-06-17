import { RowDataPacket } from "mysql2";
import pool from "../../util/mysql";
import { SearchedUser, User, UserForFilter } from "../../model/types";
import {
  convertToSearchedUser,
  convertToUserForFilter,
  convertToUsers,
} from "../../model/utils";

export const getUserIdByMailAndPassword = async (
  mail: string,
  hashPassword: string
): Promise<string | undefined> => {
  const [user] = await pool.query<RowDataPacket[]>(
    "SELECT user_id FROM user WHERE mail = ? AND password = ?",
    [mail, hashPassword]
  );
  if (user.length === 0) {
    return;
  }

  return user[0].user_id;
};

export const getUsers = async (
  limit: number,
  offset: number
): Promise<User[]> => {
  const query = `SELECT user_id, user_name, office_id, user_icon_id FROM user ORDER BY entry_date ASC, kana ASC LIMIT ? OFFSET ?`;
  const rows: RowDataPacket[] = [];

  const [userRows] = await pool.query<RowDataPacket[]>(query, [limit, offset]);
  for (const userRow of userRows) {
    const [officeRows] = await pool.query<RowDataPacket[]>(
      `SELECT office_name FROM office WHERE office_id = ?`,
      [userRow.office_id]
    );
    const [fileRows] = await pool.query<RowDataPacket[]>(
      `SELECT file_name FROM file WHERE file_id = ?`,
      [userRow.user_icon_id]
    );
    userRow.office_name = officeRows[0].office_name;
    userRow.file_name = fileRows[0].file_name;
    rows.push(userRow);
  }

  return convertToUsers(rows);
};

export const getUserByUserId = async (
  userId: string
): Promise<User | undefined> => {
  const [user] = await pool.query<RowDataPacket[]>(
    "SELECT user_id, user_name, office_id, user_icon_id FROM user WHERE user_id = ?",
    [userId]
  );
  if (user.length === 0) {
    return;
  }

  const [office] = await pool.query<RowDataPacket[]>(
    `SELECT office_name FROM office WHERE office_id = ?`,
    [user[0].office_id]
  );
  const [file] = await pool.query<RowDataPacket[]>(
    `SELECT file_name FROM file WHERE file_id = ?`,
    [user[0].user_icon_id]
  );

  return {
    userId: user[0].user_id,
    userName: user[0].user_name,
    userIcon: {
      fileId: user[0].user_icon_id,
      fileName: file[0].file_name,
    },
    officeName: office[0].office_name,
  };
};

export const getUsersByUserIds = async (
  userIds: string[]
): Promise<SearchedUser[]> => {
  let users: SearchedUser[] = [];
  for (const userId of userIds) {
    const [userRows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, user_name, kana, entry_date, office_id, user_icon_id FROM user WHERE user_id = ?",
      [userId]
    );
    if (userRows.length === 0) {
      continue;
    }

    const [officeRows] = await pool.query<RowDataPacket[]>(
      `SELECT office_name FROM office WHERE office_id = ?`,
      [userRows[0].office_id]
    );
    const [fileRows] = await pool.query<RowDataPacket[]>(
      `SELECT file_name FROM file WHERE file_id = ?`,
      [userRows[0].user_icon_id]
    );
    userRows[0].office_name = officeRows[0].office_name;
    userRows[0].file_name = fileRows[0].file_name;

    users = users.concat(convertToSearchedUser(userRows));
  }
  return users;
};

export const getUsersByUserName = async (
  userName: string
): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE MATCH(user_name) AGAINST(? IN BOOLEAN MODE)`,
    [`${userName}`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByKana = async (kana: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE MATCH(kana) AGAINST(? IN BOOLEAN MODE)`,
    [`${kana}`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByMail = async (mail: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE MATCH(mail) AGAINST(? IN BOOLEAN MODE)`,
    [`${mail}`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByDepartmentName = async (
  departmentName: string
): Promise<SearchedUser[]> => {
  const [departmentIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT department_id FROM department WHERE department_name LIKE ? AND active = true`,
    [`%${departmentName}%`]
  );
  const departmentIds: string[] = departmentIdRows.map(
    (row) => row.department_id
  );
  if (departmentIds.length === 0) {
    return [];
  }

  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM department_role_member WHERE department_id IN (?) AND belong = true`,
    [departmentIds]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByRoleName = async (
  roleName: string
): Promise<SearchedUser[]> => {
  const [roleIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT role_id FROM role WHERE role_name LIKE ? AND active = true`,
    [`%${roleName}%`]
  );
  const roleIds: string[] = roleIdRows.map((row) => row.role_id);
  if (roleIds.length === 0) {
    return [];
  }

  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM department_role_member WHERE role_id IN (?) AND belong = true`,
    [roleIds]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByOfficeName = async (
  officeName: string
): Promise<SearchedUser[]> => {
  const [officeIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT office_id FROM office WHERE office_name LIKE ?`,
    [`%${officeName}%`]
  );
  const officeIds: string[] = officeIdRows.map((row) => row.office_id);
  if (officeIds.length === 0) {
    return [];
  }

  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE office_id IN (?)`,
    [officeIds]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersBySkillName = async (
  skillName: string
): Promise<SearchedUser[]> => {
  const [skillIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT skill_id FROM skill WHERE skill_name LIKE ?`,
    [`%${skillName}%`]
  );
  const skillIds: string[] = skillIdRows.map((row) => row.skill_id);
  if (skillIds.length === 0) {
    return [];
  }

  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM skill_member WHERE skill_id IN (?)`,
    [skillIds]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByGoal = async (goal: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE MATCH(goal) AGAINST(? IN BOOLEAN MODE)`,
    [`${goal}`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUserForOwner = async (
  userId: string
): Promise<UserForFilter> => {
  let userRows: RowDataPacket[];
  let sql = `SELECT
			u.user_id,
			u.user_name,
			u.office_id,
			o.office_name,
			u.user_icon_id,
			d.department_id,
			d.department_name,
			f.file_name,
			s.skill_name
		FROM
			user u
			JOIN department_role_member drm USING(user_id)
			JOIN department d USING(department_id)
			JOIN office o USING(office_id)
			JOIN file f ON u.user_icon_id = f.file_id
			JOIN skill_member sm USING(user_id)
			JOIN skill s USING(skill_id)
		WHERE
			u.user_id = ? AND drm.belong = 1`;
  [userRows] = await pool.query<RowDataPacket[]>(
      sql,
      [userId]
    );
  const user = userRows[0];

  user.skill_names = userRows.map((row) => row.skill_name);

  return convertToUserForFilter(user);
};

export const getUserForFilter = async (
  owner: UserForFilter,
  departmentFilter: string,
  officeFilter: string,
  skillFilter: string[],
  neverMatchedFilter: boolean,
  numOfMembers: number,
  members: UserForFilter[]
): Promise<UserForFilter[]> => {
  // Select users
  let userIdRows: RowDataPacket[];
  let sql = `SELECT
			DISTINCT u.user_id
		FROM
			user u
			JOIN department_role_member drm USING(user_id)
			JOIN department d USING(department_id)
			JOIN office o USING(office_id)
			JOIN skill_member sm USING(user_id)
			JOIN skill s USING(skill_id) `
			;
  let condition = " WHERE user_id NOT IN (?) AND drm.belong = true ";
  let args: any[] = [members.map((row) => row.userId)];
  if (departmentFilter != "none") {
  	if (departmentFilter == "onlyMyDepartment") {
 		condition += " AND department_id = ? "
	} else {
 		condition += " AND department_id != ? "
	}
	args.push(owner.departmentId);
  }
  if (officeFilter != "none") {
  	if (officeFilter == "onlyMyOffice") {
 		condition += " AND office_id = ? "
	} else {
 		condition += " AND office_id != ? "
	}
	args.push(owner.officeId);
  }
  if (skillFilter.length > 0) {
  	condition += " AND s.skill_name IN (?) "
	args.push(skillFilter);
  }
  if (neverMatchedFilter) {
  	condition += " AND user_id NOT IN (SELECT DISTINCT user_id FROM match_group_member WHERE user_id = ?) ";
	args.push(owner.userId);
  }
  sql += condition + ' LIMIT ? ';
  args.push(numOfMembers);
  [userIdRows] = await pool.query<RowDataPacket[]>(
      sql,
      args
    );
  // Retrieve users
  let userRows: RowDataPacket[];
  sql = `SELECT
			u.user_id,
			u.user_name,
			u.office_id,
			o.office_name,
			u.user_icon_id,
			d.department_id,
			d.department_name,
			f.file_name,
			s.skill_name
		FROM
			user u
			JOIN department_role_member drm USING(user_id)
			JOIN department d USING(department_id)
			JOIN office o USING(office_id)
			JOIN file f ON u.user_icon_id = f.file_id
			JOIN skill_member sm USING(user_id)
			JOIN skill s USING(skill_id)
		WHERE
			u.user_id IN (?) AND drm.belong = true `;
  [userRows] = await pool.query<RowDataPacket[]>(
      sql,
      [userIdRows.map((row) => row.user_id)]
    );

  const users = userIdRows;
console.log(userIdRows, users, userRows);
  users.forEach((o, i, a) => a[i].user_name = userRows.find((u) => u.user_id == o.user_id)!.user_name as string);
  users.forEach((o, i, a) => a[i].office_id = userRows.find((u) => u.user_id == o.user_id)!.office_id as string);
  users.forEach((o, i, a) => a[i].office_name = userRows.find((u) => u.user_id == o.user_id)!.office_name as string);
  users.forEach((o, i, a) => a[i].user_icon_id = userRows.find((u) => u.user_id == o.user_id)!.user_name as string);
  users.forEach((o, i, a) => a[i].department_id = userRows.find((u) => u.user_id == o.user_id)!.department_id as string);
  users.forEach((o, i, a) => a[i].department_name = userRows.find((u) => u.user_id == o.user_id)!.department_name as string);
  users.forEach((o, i, a) => a[i].file_name = userRows.find((u) => u.user_id == o.user_id)!.file_name as string);
  users.forEach((o, i, a) => a[i].user_name = userRows.find((u) => u.user_id == o.user_id)!.user_name as string);
  users.forEach((o, i, a) => a[i].skill_names = userRows.filter((u) => u.user_id == o.user_id).map((u) => u.skill_name));

console.log(users);
  return users.map((u) => convertToUserForFilter(u));
};
