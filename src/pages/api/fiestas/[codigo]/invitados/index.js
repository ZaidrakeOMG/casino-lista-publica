import { supabase } from "../../../../../lib/supabaseServer.js";
import { cleanCode, jsonResponse } from "../../../../../lib/http.js";

function limpiarTexto(valor) {
  return String(valor || "").trim();
}

async function buscarFiesta(codigo) {
  const { data, error } = await supabase
    .from("fiestas")
    .select("id, usa_mesas")
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function POST({ params, request }) {
  const codigo = cleanCode(params.codigo);

  if (!codigo) {
    return jsonResponse({ ok: false, message: "Falta el ID de fiesta" }, 400);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, message: "Solicitud inválida" }, 400);
  }

  const nombre = limpiarTexto(body.nombre);
  const telefono = limpiarTexto(body.telefono) || null;
  const cantidadInvitados = Number(body.cantidad_invitados || 1);
  const mesaId = limpiarTexto(body.mesa_id) || null;

  if (!nombre) {
    return jsonResponse({ ok: false, message: "Escribe el nombre de la familia o responsable" }, 400);
  }

  if (!Number.isFinite(cantidadInvitados) || cantidadInvitados < 1) {
    return jsonResponse({ ok: false, message: "La cantidad de invitados debe ser mayor a cero" }, 400);
  }

  try {
    const fiesta = await buscarFiesta(codigo);

    if (!fiesta) {
      return jsonResponse({ ok: false, message: "No se encontró una fiesta con ese ID" }, 404);
    }

    const payload = {
      fiesta_id: fiesta.id,
      nombre,
      telefono,
      cantidad_invitados: cantidadInvitados,
      mesa_id: fiesta.usa_mesas ? mesaId : null
    };

    const { data, error } = await supabase
      .from("invitados")
      .insert(payload)
      .select("id, nombre, telefono, cantidad_invitados, mesa_id, asistio, created_at")
      .maybeSingle();

    if (error) {
      return jsonResponse({ ok: false, message: error.message }, 500);
    }

    return jsonResponse({ ok: true, invitado: data });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message }, 500);
  }
}

export async function DELETE({ params, request }) {
  const codigo = cleanCode(params.codigo);

  if (!codigo) {
    return jsonResponse({ ok: false, message: "Falta el ID de fiesta" }, 400);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, message: "Solicitud inválida" }, 400);
  }

  const invitadoId = limpiarTexto(body.id || body.invitado_id);

  if (!invitadoId) {
    return jsonResponse({ ok: false, message: "Falta el invitado a eliminar" }, 400);
  }

  try {
    const fiesta = await buscarFiesta(codigo);

    if (!fiesta) {
      return jsonResponse({ ok: false, message: "No se encontró una fiesta con ese ID" }, 404);
    }

    const { data, error } = await supabase
      .from("invitados")
      .delete()
      .eq("id", invitadoId)
      .eq("fiesta_id", fiesta.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return jsonResponse({ ok: false, message: error.message }, 500);
    }

    if (!data) {
      return jsonResponse({ ok: false, message: "No se encontró el invitado" }, 404);
    }

    return jsonResponse({ ok: true, invitado_eliminado: data.id });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message }, 500);
  }
}
