import { supabase } from "../../../../../lib/supabaseServer.js";
import { cleanCode, jsonResponse } from "../../../../../lib/http.js";

const ADMIN_CODE = "2525";

function limpiarTexto(valor) {
  return String(valor || "").trim();
}

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

export async function GET({ params }) {
  const codigo = cleanCode(params.codigo);

  if (!codigo) {
    return jsonResponse({ ok: false, message: "Falta el ID de fiesta" }, 400);
  }

  try {
    const fiesta = await buscarFiesta(codigo);

    if (!fiesta) {
      return jsonResponse({ ok: false, message: "No se encontró la fiesta" }, 404);
    }

    const { data, error } = await supabase
      .from("mesas")
      .select("id, nombre, capacidad")
      .eq("fiesta_id", fiesta.id);

    if (error) {
      return jsonResponse({ ok: false, message: error.message }, 500);
    }

    return jsonResponse({ ok: true, mesas: ordenarMesas(data) });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message }, 500);
  }
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

  const adminCode = limpiarTexto(body.admin_code || body.admin_mesas_code);
  const cantidadMesas = Math.trunc(Number(body.cantidad_mesas || 0));
  const capacidad = Math.trunc(Number(body.capacidad || body.capacidad_por_mesa || 0));

  if (adminCode !== ADMIN_CODE) {
    return jsonResponse({ ok: false, message: "Código administrador incorrecto" }, 401);
  }

  if (!Number.isInteger(cantidadMesas) || cantidadMesas < 1 || cantidadMesas > 120) {
    return jsonResponse({ ok: false, message: "El número de mesas no es válido" }, 400);
  }

  if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 50) {
    return jsonResponse({ ok: false, message: "El número de personas por mesa no es válido" }, 400);
  }

  try {
    const fiesta = await buscarFiesta(codigo);

    if (!fiesta) {
      return jsonResponse({ ok: false, message: "No se encontró la fiesta" }, 404);
    }

    const { data: mesasActuales, error: errorMesas } = await supabase
      .from("mesas")
      .select("id, nombre, capacidad")
      .eq("fiesta_id", fiesta.id);

    if (errorMesas) {
      return jsonResponse({ ok: false, message: errorMesas.message }, 500);
    }

    const mesas = mesasActuales || [];
    const numerosDeseados = new Set(Array.from({ length: cantidadMesas }, (_, index) => index + 1));
    const numerosExistentes = new Set();
    const vistos = new Set();
    const idsParaEliminar = [];
    const idsParaMantener = [];

    for (const mesa of mesas) {
      const numero = obtenerNumeroMesa(mesa.nombre);

      if (!numerosDeseados.has(numero) || vistos.has(numero)) {
        idsParaEliminar.push(mesa.id);
      } else {
        vistos.add(numero);
        numerosExistentes.add(numero);
        idsParaMantener.push(mesa.id);
      }
    }

    if (idsParaEliminar.length) {
      const { error: errorDeleteInvitados } = await supabase
        .from("invitados")
        .delete()
        .eq("fiesta_id", fiesta.id)
        .in("mesa_id", idsParaEliminar);

      if (errorDeleteInvitados) {
        return jsonResponse({ ok: false, message: errorDeleteInvitados.message }, 500);
      }

      const { error: errorDeleteMesas } = await supabase
        .from("mesas")
        .delete()
        .eq("fiesta_id", fiesta.id)
        .in("id", idsParaEliminar);

      if (errorDeleteMesas) {
        return jsonResponse({ ok: false, message: errorDeleteMesas.message }, 500);
      }
    }

    const nuevasMesas = [];

    for (let numero = 1; numero <= cantidadMesas; numero++) {
      if (!numerosExistentes.has(numero)) {
        nuevasMesas.push({
          fiesta_id: fiesta.id,
          nombre: `Mesa ${numero}`,
          capacidad
        });
      }
    }

    if (nuevasMesas.length) {
      const { error: errorInsert } = await supabase
        .from("mesas")
        .insert(nuevasMesas);

      if (errorInsert) {
        return jsonResponse({ ok: false, message: errorInsert.message }, 500);
      }
    }

    if (idsParaMantener.length) {
      const { error: errorUpdateMesas } = await supabase
        .from("mesas")
        .update({ capacidad })
        .eq("fiesta_id", fiesta.id)
        .in("id", idsParaMantener);

      if (errorUpdateMesas) {
        return jsonResponse({ ok: false, message: errorUpdateMesas.message }, 500);
      }
    }

    const { error: errorFiesta } = await supabase
      .from("fiestas")
      .update({ usa_mesas: true })
      .eq("id", fiesta.id);

    if (errorFiesta) {
      return jsonResponse({ ok: false, message: errorFiesta.message }, 500);
    }

    const { data: mesasFinales, error: errorFinal } = await supabase
      .from("mesas")
      .select("id, nombre, capacidad")
      .eq("fiesta_id", fiesta.id);

    if (errorFinal) {
      return jsonResponse({ ok: false, message: errorFinal.message }, 500);
    }

    return jsonResponse({
      ok: true,
      message: `Se guardaron ${cantidadMesas} mesas correctamente`,
      mesas: ordenarMesas(mesasFinales)
    });
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

  const adminCode = limpiarTexto(body.admin_code || body.admin_mesas_code);

  if (adminCode !== ADMIN_CODE) {
    return jsonResponse({ ok: false, message: "Código administrador incorrecto" }, 401);
  }

  try {
    const fiesta = await buscarFiesta(codigo);

    if (!fiesta) {
      return jsonResponse({ ok: false, message: "No se encontró la fiesta" }, 404);
    }

    const { error: errorInvitados } = await supabase
      .from("invitados")
      .delete()
      .eq("fiesta_id", fiesta.id);

    if (errorInvitados) {
      return jsonResponse({ ok: false, message: errorInvitados.message }, 500);
    }

    const { error: errorMesas } = await supabase
      .from("mesas")
      .delete()
      .eq("fiesta_id", fiesta.id);

    if (errorMesas) {
      return jsonResponse({ ok: false, message: errorMesas.message }, 500);
    }

    const { error: errorFiesta } = await supabase
      .from("fiestas")
      .update({ usa_mesas: false })
      .eq("id", fiesta.id);

    if (errorFiesta) {
      return jsonResponse({ ok: false, message: errorFiesta.message }, 500);
    }

    return jsonResponse({
      ok: true,
      message: "Mesas e invitados eliminados correctamente",
      mesas: [],
      invitados_eliminados: true
    });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message }, 500);
  }
}
