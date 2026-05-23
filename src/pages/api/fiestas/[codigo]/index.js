import { supabase } from "../../../../lib/supabaseServer.js";
import { cleanCode, jsonResponse } from "../../../../lib/http.js";

function obtenerNumeroMesa(nombre) {
  const match = String(nombre || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function ordenarMesas(mesas) {
  return [...(mesas || [])].sort((a, b) => {
    const numeroA = obtenerNumeroMesa(a.nombre);
    const numeroB = obtenerNumeroMesa(b.nombre);

    if (numeroA && numeroB) {
      return numeroA - numeroB;
    }

    return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
  });
}

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

  const { data: mesasData, error: mesasError } = await supabase
    .from("mesas")
    .select("id, fiesta_id, nombre, capacidad, created_at")
    .eq("fiesta_id", fiesta.id);

  if (mesasError) {
    return jsonResponse({ ok: false, message: mesasError.message }, 500);
  }

  const { data: invitadosData, error: invitadosError } = await supabase
    .from("invitados")
    .select("id, fiesta_id, nombre, telefono, cantidad_invitados, mesa_id, asistio, created_at")
    .eq("fiesta_id", fiesta.id)
    .order("created_at", { ascending: true });

  if (invitadosError) {
    return jsonResponse({ ok: false, message: invitadosError.message }, 500);
  }

  const mesas = ordenarMesas(mesasData || []);
  const mapaMesas = new Map(mesas.map((mesa) => [mesa.id, mesa]));

  const invitados = (invitadosData || []).map((invitado) => {
    const mesa = invitado.mesa_id ? mapaMesas.get(invitado.mesa_id) : null;

    return {
      ...invitado,
      mesa_nombre: mesa?.nombre || null,
      mesa_numero: mesa ? obtenerNumeroMesa(mesa.nombre) : null,
      mesa_capacidad: mesa?.capacidad || null
    };
  });

  const totalPersonas = invitados.reduce((suma, item) => {
    return suma + Number(item.cantidad_invitados || 0);
  }, 0);

  return jsonResponse({
    ok: true,
    fiesta,
    mesas,
    invitados,
    totales: {
      registros: invitados.length,
      personas: totalPersonas
    }
  });
}
