import fetch from "node-fetch"; // Only if using Node <18. Otherwise, native fetch works.

export const sendTaskToN8N = async (newTask, departmentName, userData, userDepartment) => {
  try {
    const payload = {
      task_id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      department: {
        id: newTask.department_id,
        name: departmentName || "Unknown",
      },
      created_by: {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        department: userDepartment?.name || "Unknown",
      },
    };

    const response = await fetch(
      "https://webhook.agenciafocomkt.com.br/webhook/af4da324-7f87-4c24-92f7-59d162e6a05e",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    // Log response for debugging
    const text = await response.text();
    console.log("✅ n8n webhook response:", text);

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }
  } catch (err) {
    console.error("❌ Error sending task to n8n webhook:", err);
  }
};
