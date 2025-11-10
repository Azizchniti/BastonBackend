import { supabaseAdmin } from "../config/supabaseClient.js";

// ✅ Get all users
export const getAllUsers = async () => {
  const { data, error } = await supabaseAdmin.from("users").select("*");
  if (error) throw error;
  return data;
};

// ✅ Get user by ID
export const getUserById = async (id) => {
  const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};

// ✅ Create user (already handled via register, but could wrap it)
export const createUser = async (creatorRole, userData) => {
  // Enforce roles
  const safeRole = userData.role === "admin" && creatorRole !== "admin" ? "user" : userData.role;

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert([{ ...userData, role: safeRole }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ✅ Update user by ID
export const updateUser = async (id, updateData) => {
  const { data, error } = await supabaseAdmin.from("users").update(updateData).eq("id", id).select().single();
  if (error) throw error;
  return data;
};

// ✅ Delete user by ID
export const deleteUser = async (id) => {
  const { data, error } = await supabaseAdmin.from("users").delete().eq("id", id).select();
  if (error) throw error;
  return data;
};

export const getTasksByUser = async (userId) => {
  try {
    // 1️⃣ Fetch user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("department")
      .eq("id", userId)
      .single();

    if (userError || !user) throw new Error("Usuário não encontrado.");

    // 2️⃣ Match department exactly by name
    const { data: department, error: deptError } = await supabaseAdmin
      .from("departments")
      .select("id")
      .eq("name", user.department)
      .single();

    if (deptError || !department) throw new Error("Departamento não encontrado.");

    // 3️⃣ Get all tasks for the department, including support members
   const { data: tasks, error: taskError } = await supabaseAdmin
  .from("tasks")
  .select(`
    *,
    task_support_members (
      user_id,
      added_by_user: users!task_support_members_user_id_fkey (id, first_name, last_name)
    ),
    creator: users!tasks_created_by_fkey (id, first_name, last_name, department)
  `)
  .eq("department_id", department.id);

    if (taskError) throw taskError;

    // 4️⃣ Filter tasks according to the rules
    const visibleTasks = (tasks || []).filter((task) => {
      // unassigned tasks are visible to everyone in the department
      if (!task.responsible_user_id) return true;

      // tasks assigned to the current user
      if (task.responsible_user_id === userId) return true;

      // tasks where the user is a support member
      if (
        task.task_support_members?.some(
          (s) => s.user_id === userId
        )
      )
        return true;

      return false;
    });

    return visibleTasks;
  } catch (err) {
    console.error("Erro ao buscar tasks do usuário:", err.message);
    return [];
  }
};

// services/userService.js
export const getUserByAuthId = async (authId) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, email, cpf, department, role, auth_id")
    .eq("auth_id", authId)
    .single();

  if (error) throw error;
  return data;
};

export const getUsersByDepartmentId = async (deptId) => {
  const { data: dept, error: deptError } = await supabaseAdmin
    .from("departments")
    .select("name")
    .eq("id", deptId)
    .single();
  if (deptError || !dept) throw new Error("Departamento não encontrado.");

  const { data: users, error: usersError } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, email, cpf, department, role, auth_id")
    .eq("department", dept.name);

  if (usersError) throw usersError;
  return users || [];
};

