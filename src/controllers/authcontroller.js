import { supabaseAdmin } from "../config/supabaseClient.js";
import jwt from "jsonwebtoken";

// ✅ REGISTER (only admins can call this route)
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, cpf, department, role } = req.body;

    if (!firstName || !lastName || !email || !password || !cpf || !department) {
      return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    // ✅ Only 'admin' or 'user' roles are accepted
    const safeRole = role === "admin" ? "admin" : "user";

    // ✅ Optional: restrict company emails
    // if (!email.endsWith("@focomarketing.com")) {
    //   return res.status(403).json({ message: "Somente e-mails corporativos são permitidos." });
    // }

    // ✅ Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ message: "Erro ao criar usuário no Supabase Auth.", error: authError.message });
    }

    const supabaseUserId = authUser.user.id;

    // ✅ Create user profile in the public "users" table
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          auth_id: supabaseUserId,
          first_name: firstName,
          last_name: lastName,
          email,
          cpf,
          department,
          role: safeRole,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Usuário criado com sucesso!", user: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao registrar usuário.", error: error.message });
  }
};

// ✅ LOGIN (via Supabase Auth)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email e senha são obrigatórios." });

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const { data: userProfile, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ message: "Perfil de usuário não encontrado." });
    }

    const token = jwt.sign(
      { id: userProfile.id, role: userProfile.role, department: userProfile.department },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login bem-sucedido!",
      token,
      user: {
        id: userProfile.id,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        email: userProfile.email,
        role: userProfile.role,
        department: userProfile.department,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro no login.", error: error.message });
  }
};
export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user; // comes from the token decoded in middleware
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter o usuário atual." });
  }
};