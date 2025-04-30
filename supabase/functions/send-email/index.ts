import { serve } from "https://deno.land/std@0.204.0/http/server.ts";

serve(async (req) => {
  try {
    const { to, language, type, variables } = await req.json()

    if (!to || !language || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 })
    }

    // Only welcome emails for now
    const templates = {
      welcome: {
        en: 'pr9084zjyjxgw63d', // English Welcome Template ID
        nl: 'jpzkmgq8y8mg059v', // Dutch Welcome Template ID
      }
    }

    const templateId = templates[type]?.[language]

    if (!templateId) {
      return new Response(JSON.stringify({ error: 'Invalid template mapping.' }), { status: 400 })
    }

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MAILERSEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: 'noreply@cvitae.nl',
          name: 'CVitae',
        },
        to: [{ email: to }],
        template_id: templateId,
        variables,
      }),
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: response.status })
  } catch (error) {
    console.error("❌ Email send error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
