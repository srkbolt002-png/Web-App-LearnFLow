import { supabase } from '@/integrations/supabase/client';

export interface Comment {
  id: string;
  workshopId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

export const createComment = async (workshopId: string, userId: string, userName: string, message: string): Promise<Comment | null> => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      workshop_id: workshopId,
      user_id: userId,
      user_name: userName,
      message,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    workshopId: data.workshop_id,
    userId: data.user_id,
    userName: data.user_name,
    message: data.message,
    createdAt: data.created_at,
  };
};

export const getComments = async (): Promise<Comment[]> => {
  const { data } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map(c => ({
    id: c.id,
    workshopId: c.workshop_id,
    userId: c.user_id,
    userName: c.user_name,
    message: c.message,
    createdAt: c.created_at,
  }));
};

export const getWorkshopComments = async (workshopId: string): Promise<Comment[]> => {
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map(c => ({
    id: c.id,
    workshopId: c.workshop_id,
    userId: c.user_id,
    userName: c.user_name,
    message: c.message,
    createdAt: c.created_at,
  }));
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  return !error;
};
