import { supabase } from "../../../../lib/supabaseServer.js";
import { cleanCode, jsonResponse } from "../../../../lib/http.js";

export async function GET({ params }) {
  const codigo = cleanCode(params.codigo);

  if (!codigo) {
    return jsonResponse({ ok: false, message: "Falta el ID de fiesta" }, 400);
  }

  const { data: fiesta, error: fiestaError } = await supabase
    .from("fiestas")
    .select("id, codigo, usa_mesas, activa, created_at")
    .eq("codigo", codigo)
    .maybeSingle();

  if (fiestaError) {
    return jsonResponse({ ok: false, message: fiestaError.message }, 500);
  }

  if (!fiesta) {
    return jsonResponse({ ok: false, message: "No se encontró una fiesta con ese ID" }, 404);
  }

  const { data: mesas, error: mesasError } = await supabase
    .from("mesas")
    .select("id, nombre, capacidad, created_at")
    .eq("fiesta_id", fiesta.id)
    .order("created_at", { ascending: true });

  if (mesasError) {
    return jsonResponse({ ok: false, message: mesasError.message }, 500);
  }

  const { data: invitados, error: invitadosError } = await supabase
    .from("invitados")
    .select("id, nombre, telefono, cantidad_invitados, mesa_id, asistio, created_at")
    .eq("fiesta_id", fiesta.id)
    .order("created_at", { ascending: true });

  if (invitadosError) {
    return jsonResponse({ ok: false, message: invitadosError.message }, 500);
  }

  const mesasOrdenadas = (mesas || []).sort((a, b) => {
    const numeroA = Number(String(a.nombre || "").match(/\d+/)?.[0] || 0);
    const numeroB = Number(String(b.nombre || "").match(/\d+/)?.[0] || 0);

    if (numeroA && numeroB) {
      return numeroA - numeroB;
    }

    return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
  });

  const mesaPorId = new Map(mesasOrdenadas.map((mesa) => [mesa.id, mesa.nombre]));
  const lista = (invitados || []).map((invitado) => ({
    ...invitado,
    mesa_nombre: invitado.mesa_id ? mesaPorId.get(invitado.mesa_id) || null : null
  }));

  const totalPersonas = lista.reduce((suma, item) => suma + Number(item.cantidad_invitados || 0), 0);

  return jsonResponse({
    ok: true,
    fiesta,
    mesas: mesasOrdenadas,
    invitados: lista,
    totales: {
      registros: lista.length,
      personas: totalPersonas
    }
  });
}
