import { supabase } from "../../../lib/supabaseServer.js";
import { jsonResponse } from "../../../lib/http.js";

const ADMIN_CODE = "2525";

function limpiarTexto(valor) {
  return String(valor || "").trim();
}

function limpiarCodigo(valor) {
  return String(valor || "").trim().toUpperCase().replace(/\s+/g, "");
}

function generarCodigoFiesta() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "CM-";

  for (let i = 0; i < 6; i++) {
    codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
  }

  return codigo;
}

async function crearCodigoUnico() {
  for (let intento = 0; intento < 20; intento++) {
    const codigo = generarCodigoFiesta();

    const { data, error } = await supabase
      .from("fiestas")
      .select("id")
      .eq("codigo", codigo)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return codigo;
    }
  }

  throw new Error("No se pudo generar un ID único. Intenta de nuevo.");
}

async function insertarEvento(body) {
  const nombreCompleto = limpiarTexto(body.nombre_completo);
  const codigo = limpiarCodigo(body.codigo);
  const fechaEvento = limpiarTexto(body.fecha_evento);
  const nombreSalon = limpiarTexto(body.nombre_salon);

  if (!nombreCompleto || !codigo || !fechaEvento || !nombreSalon) {
    return jsonResponse({ ok: false, message: "Llena todos los campos" }, 400);
  }

  const { data, error } = await supabase
    .from("fiestas_eventos")
    .insert({
      nombre_completo: nombreCompleto,
      codigo,
      fecha_evento: fechaEvento,
      nombre_salon: nombreSalon
    })
    .select("id, codigo, nombre_completo, fecha_evento, nombre_salon, created_at")
    .maybeSingle();

  if (error) {
    return jsonResponse({ ok: false, message: error.message }, 500);
  }

  return jsonResponse({
    ok: true,
    message: "Código guardado correctamente",
    evento: data
  });
}

export async function POST({ request }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, message: "Solicitud inválida" }, 400);
  }

  /*
    NUEVO:
    Si insertar.astro manda accion: "insertar_evento",
    guarda en la tabla fiestas_eventos.
    Esto NO afecta la creación normal de fiestas.
  */
  if (body.accion === "insertar_evento") {
    return insertarEvento(body);
  }

  /*
    PROCESO ORIGINAL:
    Crear fiesta normal.
  */
  const usaMesas = Boolean(body.usa_mesas);
  const adminCode = limpiarTexto(body.admin_mesas_code || body.admin_code);
  const cantidadMesas = Number(body.cantidad_mesas || 0);
  const capacidadPorMesa = Number(body.capacidad_por_mesa || body.capacidad || 0);

  if (usaMesas && adminCode !== ADMIN_CODE) {
    return jsonResponse({ ok: false, message: "Código administrador incorrecto" }, 401);
  }

  if (usaMesas && (!Number.isInteger(cantidadMesas) || cantidadMesas < 1 || cantidadMesas > 120)) {
    return jsonResponse({ ok: false, message: "El número de mesas no es válido" }, 400);
  }

  if (usaMesas && (!Number.isInteger(capacidadPorMesa) || capacidadPorMesa < 1 || capacidadPorMesa > 50)) {
    return jsonResponse({ ok: false, message: "El número de personas por mesa no es válido" }, 400);
  }

  try {
    const codigo = await crearCodigoUnico();

    const { data: fiesta, error: errorFiesta } = await supabase
      .from("fiestas")
      .insert({
        codigo,
        usa_mesas: usaMesas
      })
      .select("id, codigo, usa_mesas")
      .maybeSingle();

    if (errorFiesta) {
      return jsonResponse({ ok: false, message: errorFiesta.message }, 500);
    }

    if (!fiesta) {
      return jsonResponse({ ok: false, message: "No se pudo crear la fiesta" }, 500);
    }

    let mesasCreadas = 0;

    if (usaMesas) {
      const mesas = [];

      for (let numero = 1; numero <= cantidadMesas; numero++) {
        mesas.push({
          fiesta_id: fiesta.id,
          nombre: `Mesa ${numero}`,
          capacidad: capacidadPorMesa
        });
      }

      const { error: errorMesas } = await supabase
        .from("mesas")
        .insert(mesas);

      if (errorMesas) {
        await supabase.from("fiestas").delete().eq("id", fiesta.id);
        return jsonResponse({ ok: false, message: errorMesas.message }, 500);
      }

      mesasCreadas = mesas.length;
    }

    return jsonResponse({
      ok: true,
      fiesta: {
        id: fiesta.id,
        codigo: fiesta.codigo,
        usa_mesas: fiesta.usa_mesas
      },
      mesas_creadas: mesasCreadas
    });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message }, 500);
  }
}