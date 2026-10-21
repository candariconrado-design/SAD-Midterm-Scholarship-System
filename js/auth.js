document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const message = document.getElementById("login-message");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      if (SUPABASE_URL.includes("YOUR-PROJECT") || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
        throw new Error("Set your Supabase URL and anon/publishable key in js/supabase.js first.");
      }
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
      });
      if (error) throw error;
      window.location.href = "dashboard.html";
    } catch (error) {
      message.textContent = error.message || "Unable to sign in.";
    } finally {
      button.disabled = false;
    }
  });
});