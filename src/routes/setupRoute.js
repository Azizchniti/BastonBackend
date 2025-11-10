import express from "express";
import { supabaseAdmin } from "../config/supabaseClient.js";
import bcrypt from "bcrypt";

const router = express.Router();

/**
 * ⚠️ Temporary setup route — run ONCE to create the first admin
 * After using it successfully, DELETE or comment out this route!
 */
router.post("/create-initial-admin", async (req, res) => {
  try {
    const { firstName, lastName, email, password, cpf, department } = req.body;

    if (!firstName || !lastName || !email || !password || !cpf || !department) {
      return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    // ✅ Create admin in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ message: "Erro ao criar usuário no Supabase Auth.", error: authError.message });
    }

    const supabaseUserId = authUser.user.id;

    // ✅ Create admin profile in "users" table
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
          role: "admin",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Administrador inicial criado com sucesso!", admin: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar administrador inicial.", error: error.message });
  }
});

export default router;
