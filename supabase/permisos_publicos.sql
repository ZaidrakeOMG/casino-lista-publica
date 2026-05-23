drop policy if exists "fiestas_select_public" on public.fiestas;
drop policy if exists "fiestas_insert_public" on public.fiestas;
drop policy if exists "fiestas_update_public" on public.fiestas;
drop policy if exists "fiestas_delete_public" on public.fiestas;
drop policy if exists "mesas_select_public" on public.mesas;
drop policy if exists "mesas_insert_public" on public.mesas;
drop policy if exists "mesas_update_public" on public.mesas;
drop policy if exists "mesas_delete_public" on public.mesas;
drop policy if exists "invitados_select_public" on public.invitados;
drop policy if exists "invitados_insert_public" on public.invitados;
drop policy if exists "invitados_update_public" on public.invitados;
drop policy if exists "invitados_delete_public" on public.invitados;

create policy "fiestas_select_public"
on public.fiestas
for select
to anon, authenticated
using (true);

create policy "fiestas_insert_public"
on public.fiestas
for insert
to anon, authenticated
with check (true);

create policy "fiestas_update_public"
on public.fiestas
for update
to anon, authenticated
using (true)
with check (true);

create policy "fiestas_delete_public"
on public.fiestas
for delete
to anon, authenticated
using (true);

create policy "mesas_select_public"
on public.mesas
for select
to anon, authenticated
using (true);

create policy "mesas_insert_public"
on public.mesas
for insert
to anon, authenticated
with check (true);

create policy "mesas_update_public"
on public.mesas
for update
to anon, authenticated
using (true)
with check (true);

create policy "mesas_delete_public"
on public.mesas
for delete
to anon, authenticated
using (true);

create policy "invitados_select_public"
on public.invitados
for select
to anon, authenticated
using (true);

create policy "invitados_insert_public"
on public.invitados
for insert
to anon, authenticated
with check (true);

create policy "invitados_update_public"
on public.invitados
for update
to anon, authenticated
using (true)
with check (true);

create policy "invitados_delete_public"
on public.invitados
for delete
to anon, authenticated
using (true);
