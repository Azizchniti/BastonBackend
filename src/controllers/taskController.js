import * as taskService from "../services/taskService.js";
import * as taskMessageService from "../services/taskMessageService.js";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { sendTaskToN8N } from "../utils/n8nAgent.js";

// ✅ Create a new task
export const createTaskController = async (req, res) => {
  try {
    const { title, description, department_id, deadline } = req.body;
    const created_by = req.user.id;

    console.log("➡️ createTaskController body:", req.body);
    console.log("➡️ Auth user:", req.user);

    // 1️⃣ Create the new task
    const newTask = await taskService.createTask({
      title,
      description,
      department_id,
      status: "new",
      created_by,
      deadline,
    });

    console.log("New task returned:", newTask);

    // 2️⃣ Fetch department name
    // 2️⃣ Fetch department name
const { data: departmentData, error: deptError } = await supabaseAdmin
  .from("departments")
  .select("id, name")
  .eq("id", department_id)
  .single();

if (deptError) {
  console.warn("⚠️ Department fetch error:", deptError.message);
}

// 3️⃣ Fetch user info
const { data: userData, error: userError } = await supabaseAdmin
  .from("users")
  .select("id, first_name, last_name, email, department")
  .eq("id", created_by)
  .single();

if (userError) {
  console.warn("⚠️ User fetch error:", userError.message);
}

// 4️⃣ Fetch user department name (optional)
let userDepartment = { name: "Unknown" };
if (userData?.department_id) {
  const { data, error } = await supabaseAdmin
    .from("departments")
    .select("name")
    .eq("id", userData.department_id)
    .single();

  if (error) {
    console.warn("⚠️ User department fetch error:", error.message);
  } else {
    userDepartment = data;
  }
}


    // 5️⃣ Send enriched data to n8n webhook (only if task exists)
    try {
   await sendTaskToN8N(newTask, departmentData?.name, userData, userDepartment,req.user.token);

    } catch (err) {
      console.error("❌ Error sending task to n8n webhook:", err);
    }

    // 6️⃣ Respond to frontend
    res.status(201).json({
      message: "Chamado criado com sucesso!",
      task: newTask,
    });
  } catch (err) {
    console.error("❌ Erro ao criar chamado:", err);
    res.status(500).json({ message: err.message });
  }
};



// ✅ Get all tasks (with responsible and support users)
export const getTasksController = async (req, res) => {
  try {
    const { status } = req.query;
    const tasks = await taskService.getTasks(status);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get messages of a task
export const getTaskMessagesController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const messages = await taskMessageService.getMessagesByTaskId(taskId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Add a message to a task
export const addTaskMessageController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, is_ai = false } = req.body;
    const sender_id = is_ai ? null : req.user.id;

    const newMessage = await taskMessageService.addMessage({
      task_id: taskId,
      sender_id,
      content,
      is_ai,
    });

    res.status(201).json({ message: "Mensagem adicionada!", data: newMessage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Assume a task or add user as support
export const assumeTaskController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const userDepartment = req.user.department;

    const result = await taskService.assumeTask(taskId, userId, userDepartment);
    res.status(200).json({ message: "Você agora faz parte do time desse chamado.", data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Add support user manually
export const addSupportUserController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    const userDepartment = req.user.department;

    const support = await taskService.addSupportUser(taskId, userId, userDepartment);
    res.status(201).json({ message: "Usuário adicionado como suporte.", data: support });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get support users for a task
export const getTaskSupportController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const supportUsers = await taskService.getTaskSupport(taskId);
    res.json(supportUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ✅ Update task
// ✅ Update task
export const updateTaskController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;
    const task = await taskService.getTaskById(taskId);

    if (!task) return res.status(404).json({ message: "Task não encontrada." });

    // Only creator or admin can update
    // if (task.created_by !== req.user.id && req.user.role !== "admin") {
    //   return res.status(403).json({ message: "Você não tem permissão para atualizar este task." });
    // }

    const updatedTask = await taskService.updateTask(taskId, updateData);
    res.json({ message: "Task atualizada!", task: updatedTask });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete task
export const deleteTaskController = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await taskService.getTaskById(taskId);

    if (!task) return res.status(404).json({ message: "Task não encontrada." });

    // Only creator or admin can delete
    if (task.created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Você não tem permissão para deletar este task." });
    }

    await taskService.deleteTask(taskId);
    res.json({ message: "Task deletada!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ✅ Get task by ID with users and messages
export const getTaskByIdController = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTaskByIdFull(taskId);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

