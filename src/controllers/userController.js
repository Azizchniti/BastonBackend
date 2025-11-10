import * as userService from "../services/userService.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

// GET /users
export const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /users/:id
export const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// PUT /users/:id
export const updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /users/:id
export const deleteUser = async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    res.json({ message: "Usuário deletado com sucesso", deleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const createUserController = async (req, res) => {
  try {
    const creatorRole = req.user.role; // From verifyToken middleware
    const { first_name, last_name, email, cpf, department, role } = req.body;

    if (!first_name || !last_name || !email || !cpf || !department) {
      return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    const newUser = await userService.createUser(creatorRole, {
      first_name,
      last_name,
      email,
      cpf,
      department,
      role,
    });

    res.status(201).json({ message: "Usuário criado com sucesso!", user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getUserTasks = async (req, res) => {
  try {
    const userId = req.params.id;
    const tasks = await userService.getTasksByUser(userId);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getUsersByDepartment = async (req, res) => {
  try {
    const deptId = req.params.id; // department UUID from the task
    const requesterAuthId = req.user?.sub || req.user?.id;

    // 1️⃣ Find department name using department_id
    const { data: dept, error: deptError } = await supabaseAdmin
      .from("departments")
      .select("name")
      .eq("id", deptId)
      .single();

    if (deptError || !dept) {
      console.error("Departamento não encontrado:", deptError);
      return res.status(404).json({ message: "Departamento não encontrado." });
    }

    const departmentName = dept.name;

    // 2️⃣ Find requester’s user record
   // use the user ID, not auth_id
const { data: requester, error: reqErr } = await supabaseAdmin
  .from("users")
  .select("id, auth_id, department, role")
  .eq("id", req.user.id) // match on the users table primary id
  .maybeSingle();

if (!requester) {
  return res.status(403).json({ message: "Usuário não encontrado na tabela interna." });
}


    // 3️⃣ Authorization: requester can only access their own department
    if (requester.department !== departmentName) {
      console.warn(
        `Acesso negado: ${requester.department} != ${departmentName}`
      );
      return res.status(403).json({ message: "Acesso negado ao departamento." });
    }

    // 4️⃣ Fetch users of that department
    const users = await userService.getUsersByDepartmentId(deptId);
    res.status(200).json(users);
  } catch (err) {
    console.error("Erro getUsersByDepartment:", err);
    res.status(500).json({ message: err.message });
  }
};