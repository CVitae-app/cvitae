import { supabase } from "./supabaseClient"; // Adjust path if needed

export const sendEmail = async (
  to: string,
  language: "en" | "nl",
  type: "welcome" | "subscription",
  variables: Record<string, any>
) => {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, language, type, variables },
  });

  if (error) {
    console.error("❌ Failed to send email:", error);
  } else {
    console.log("✅ Email sent successfully:", data);
  }
};
