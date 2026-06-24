import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST({ request }) {
  try {
    const body = await request.json();

    const { nombre_completo, codigo, fecha_evento, nombre_salon } = body;

    if (!nombre_completo || !codigo || !fecha_evento || !nombre_salon) {
      return new Response(JSON.stringify({
        ok: false,
        message: "Faltan datos obligatorios"
      }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const { data, error } = await supabase
      .from("fiestas_eventos")
      .insert({
        nombre_completo,
        codigo,
        fecha_evento,
        nombre_salon
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({
        ok: false,
        message: error.message
      }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      data
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      message: error.message || "Error interno"
    }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}

