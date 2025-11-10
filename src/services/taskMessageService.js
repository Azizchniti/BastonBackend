import { supabaseAdmin } from "../config/supabaseClient.js";

// ✅ Add a message to a task
export const addMessage = async (messageData) => {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert([messageData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ✅ Get messages by task ID
export const getMessagesByTaskId = async (task_id) => {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(`
      *,
      sender: users!messages_sender_id_fkey (id, first_name, last_name)
    `)
    .eq("task_id", task_id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};

