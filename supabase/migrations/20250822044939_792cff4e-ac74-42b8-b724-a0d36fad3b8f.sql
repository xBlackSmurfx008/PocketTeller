
-- Allow users to delete their own conversation rows
create policy "Users can delete their own conversations"
on public.conversations
for delete
using (auth.uid() = user_id);
