
-- Allow users to delete their own legs
create policy "Users can delete their own legs"
on public.legs
for delete
to authenticated
using (auth.uid() = user_id);

-- Allow commissioners to delete any leg
create policy "Commissioners can delete any leg"
on public.legs
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'COMMISSIONER'::app_role
  )
);

-- Allow commissioners to update any leg (e.g., status changes)
create policy "Commissioners can update any leg"
on public.legs
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'COMMISSIONER'::app_role
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'COMMISSIONER'::app_role
  )
);
