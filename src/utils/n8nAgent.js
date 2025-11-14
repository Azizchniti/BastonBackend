import fetch from "node-fetch"; // Only if using Node <18. Otherwise, native fetch works.

export const sendTaskToN8N = async (newTask, departmentName, userData, userDepartment, userToken) => {
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
      user_token: userToken // ✅ add the token here
    };

    const response = await fetch(
      "https://webhook.agenciafocomkt.com.br/webhook/f77dcc2e-bf68-40e5-9231-06293e29bec7",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Optionally, you could also send it in headers
          // "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();
    console.log("✅ n8n webhook response:", text);

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }
  } catch (err) {
    console.error("❌ Error sending task to n8n webhook:", err);
  }
};

