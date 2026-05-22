# casino-lista-publica

Aplicación pública de Casino Moments para crear una fiesta, generar un ID y capturar invitados.

## Flujo correcto

1. En el inicio aparece Crear fiesta.
2. Al crear la fiesta se genera un ID.
3. La persona debe anotar el ID y pasarlo a Casino Moments.
4. Si la persona sale de la página, al regresar debe introducir su ID para cargar la lista.
5. Dentro de la lista puede agregar nombre de la familia o responsable, número de teléfono y cantidad de invitados.
6. Si la fiesta fue creada con mesas, aparece el campo de mesa.
7. Si la fiesta fue creada sin mesas, no aparece el campo de mesa.

## Requisitos

- Node.js instalado
- Proyecto de Supabase creado
- URL de Supabase
- Service role key de Supabase

## Paso 1: Crear tablas en Supabase

Abre Supabase, entra a SQL Editor y ejecuta el archivo:

```txt
supabase/schema.sql
```

Si ya habías ejecutado la versión anterior, ejecuta también:

```txt
supabase/migracion_v2_crear_fiesta_solo_id.sql
```

## Paso 2: Configurar variables

Copia `.env.example` como `.env`:

```bash
copy .env.example .env
```

En Mac/Linux:

```bash
cp .env.example .env
```

Edita `.env`:

```env
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
PUBLIC_APP_NAME=Casino Moments Lista
```

## Paso 3: Instalar dependencias

```bash
npm install
```

## Paso 4: Ejecutar

```bash
npm run dev
```

Abre:

```txt
http://localhost:4321
```

## Rutas

```txt
/
```

Inicio para crear fiesta o introducir ID.

```txt
/fiesta/CM-XXXXXX
```

Lista pública para capturar invitados.

## Importante

No subas el archivo `.env` a internet.

La llave `SUPABASE_SERVICE_ROLE_KEY` solo debe vivir en el servidor.
