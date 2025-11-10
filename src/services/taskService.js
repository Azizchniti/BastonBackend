import { supabaseAdmin } from "../config/supabaseClient.js";

// ✅ Create a new task
export const createTask = async (taskData) => {
  const { data, error } = await supabaseAdmin
  .from("tasks")
  .insert([
    {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || "new",
      created_by: taskData.created_by,
      department_id: taskData.department_id,
      deadline: taskData.deadline || null,
    },
  ])
  .select()
  .single(); // <--- important: returns the inserted row as an object, not an array

if (error) throw error;
return data;
};




// ✅ Get all tasks (optionally by status)
export const getTasks = async (status) => {
  let query = supabaseAdmin.from("tasks").select("*");
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ✅ Get task by ID
export const getTaskById = async (id) => {
  const { data, error } = await supabaseAdmin.from("tasks").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};

// ✅ Assume task (sets responsible_user_id or adds to support)
export const assumeTask = async (taskId, userId) => {
  // 1️⃣ Fetch user department
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("department")
    .eq("id", userId) // ✅ match user.id
    .single();

  if (userError || !user) throw new Error("Usuário não encontrado.");

  // 2️⃣ Fetch task
  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error || !task) throw new Error("Task not found");

  // 3️⃣ Fetch department name from task
  const { data: dept, error: deptError } = await supabaseAdmin
    .from("departments")
    .select("name")
    .eq("id", task.department_id)
    .single();

  if (deptError || !dept) throw new Error("Departamento não encontrado.");

  // 4️⃣ Validate user department
  if (dept.name !== user.department)
    throw new Error("Você não pertence a esse departamento.");

  // 5️⃣ Assign or add support
  if (!task.responsible_user_id) {
    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from("tasks")
      .update({ responsible_user_id: userId })
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedTask;
  } else {
    const { data: support, error: supportError } = await supabaseAdmin
      .from("task_support")
      .insert([{ task_id: taskId, user_id: userId }])
      .select()
      .single();

    if (supportError) throw supportError;
    return support;
  }
};



// ✅ Get support users for a task
export const getTaskSupport = async (taskId) => {
  const { data, error } = await supabaseAdmin
    .from("task_support")
    .select("user_id, users(first_name, last_name, email)")
    .eq("task_id", taskId);
  if (error) throw error;
  return data;
};

// ✅ Add support user manually (with duplicate prevention)
export const addSupportUser = async (taskId, userId) => {
  // 1️⃣ Fetch user department
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("department")
    .eq("id", userId)
    .single();
  if (userError || !user) throw new Error("Usuário não encontrado.");

  // 2️⃣ Fetch task
  const { data: task, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (taskError || !task) throw new Error("Task not found");

  // 3️⃣ Fetch department name from task
  const { data: dept, error: deptError } = await supabaseAdmin
    .from("departments")
    .select("name")
    .eq("id", task.department_id)
    .single();
  if (deptError || !dept) throw new Error("Departamento não encontrado.");

  // 4️⃣ Validate user department
  if (dept.name !== user.department) throw new Error("Você não pertence a esse departamento.");

  // 5️⃣ Add to task_support if not already
  const { data: existingSupport } = await supabaseAdmin
    .from("task_support")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .single();

  if (!existingSupport) {
    const { error: supportError } = await supabaseAdmin
      .from("task_support")
      .insert([{ task_id: taskId, user_id: userId }]);
    if (supportError) throw supportError;
  }

  // 6️⃣ Add to task_support_members so it appears in Meus Chamados
  const { data: existingMember } = await supabaseAdmin
    .from("task_support_members")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .single();

  if (!existingMember) {
    const { error: memberError } = await supabaseAdmin
      .from("task_support_members")
      .insert([{ task_id: taskId, user_id: userId }]);
    if (memberError) throw memberError;
  }

  return { message: "Usuário adicionado como suporte!" };
};


// ✅ Update task by ID
export const updateTask = async (id, updateData) => {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ✅ Delete task by ID
export const deleteTask = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return data;
};
// ✅ Get all tasks with responsible user and support users
export const getTasksWithUsers = async (status) => {
  let query = supabaseAdmin
    .from("tasks")
    .select(`
      *,
      department:departments(id, name),
      responsible_user:users(id, first_name, last_name, email),
      support_users:task_support(user_id, users(id, first_name, last_name, email))
    `);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ✅ Get task by ID with responsible, support users, and messages
export const getTaskByIdFull = async (taskId) => {
  // 1️⃣ Fetch the task itself
  const { data: task, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (taskError || !task) throw new Error("Task not found");

  // 2️⃣ Fetch responsible user
  const { data: responsibleUser, error: respError } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("id", task.responsible_user_id)
    .single();

  if (respError) throw new Error("Responsible user not found");

  // 3️⃣ Fetch support users
  const { data: supportUsers, error: supportError } = await supabaseAdmin
    .from("task_support")
    .select("user_id, users(id, first_name, last_name, email)")
    .eq("task_id", taskId);

  if (supportError) throw supportError;

  // 4️⃣ Fetch messages
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("*, sender:users(id, first_name, last_name, email)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;

  // 5️⃣ Return combined object
  return {
    ...task,
    responsible_user: responsibleUser,
    support_users: supportUsers,
    messages,
  };
};

