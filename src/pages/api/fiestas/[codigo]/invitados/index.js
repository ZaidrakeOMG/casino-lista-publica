import { supabase } from "../../../../../lib/supabaseServer.js";
import { cleanCode, jsonResponse } from "../../../../../lib/http.js";

function limpiarTexto(valor) {
  return String(valor || "").trim();
}

function limpiarId(valor) {
  const texto = limpiarTexto(valor);

  if (!texto || texto === "null" || texto === "undefined") {
    return null;
  }

  return texto;
}

async function buscarFiesta(codigo) {
  const { data, error } = await supabase
    .from("fiestas")
    .select("id, codigo, usa_mesas")
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function validarMesaDeFiesta(mesaId, fiestaId) {
  if (!mesaId) {
    return null;
  }

  const { data, error } = await supabase
    .from("mesas")
    .select("id")
    .eq("id", mesaId)
    .eq("fiesta_id", fiestaId)
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
  const cantidadInvitados = Math.trunc(Number(body.cantidad_invitados || 1));
  const mesaId = limpiarId(body.mesa_id);

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

    let mesaFinal = null;

    if (fiesta.usa_mesas && mesaId) {
      const mesa = await validarMesaDeFiesta(mesaId, fiesta.id);

      if (!mesa) {
        return jsonResponse({ ok: false, message: "La mesa seleccionada no pertenece a esta fiesta" }, 400);
      }

      mesaFinal = mesa.id;
    }

    const { data, error } = await supabase
      .from("invitados")
      .insert({
        fiesta_id: fiesta.id,
        nombre,
        telefono,
        cantidad_invitados: cantidadInvitados,
        mesa_id: mesaFinal
      })
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

  const invitadoId = limpiarId(body.id || body.invitado_id);

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
      return jsonResponse({ ok: false, message: "No se encontró el invitado en esta fiesta" }, 404);
    }

    return jsonResponse({ ok: true, invitado_eliminado: data.id });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message }, 500);
  }
}
