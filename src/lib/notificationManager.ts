import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  userId: string;
  itemId: string; // courseId or workshopId
  itemTitle: string; // course or workshop title
  itemType: string;
  type: 'course_update' | 'new_lesson' | 'achievement' | 'workshop_live' | 'workshop_update' | 'certificate_issued' | 'enrollment';
  message: string;
  createdAt: string;
  read: boolean;
}

export const createNotification = async (
  userId: string,
  itemId: string,
  itemTitle: string,
  itemType: 'course' | 'workshop',
  type: Notification['type'],
  message: string
): Promise<Notification | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      item_id: itemId,
      item_title: itemTitle,
      item_type: itemType,
      type,
      message,
      is_read: false,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    itemId: data.item_id,
    itemTitle: data.item_title,
    itemType: data.item_type,
    type: data.type,
    message: data.message,
    createdAt: data.created_at,
    read: data.is_read,
  };
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  if (!supabase) return [];

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map(n => ({
    id: n.id,
    userId: n.user_id,
    itemId: n.item_id,
    itemTitle: n.item_title,
    itemType: n.item_type,
    type: n.type,
    message: n.message,
    createdAt: n.created_at,
    read: n.is_read,
  }));
};

export const markAsRead = async (notificationId: string): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  return !error;
};

export const markAllAsRead = async (userId: string): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return !error;
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  if (!supabase) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return count || 0;
};

export const notifyEnrolledStudents = async (courseId: string, courseTitle: string, type: Notification['type'], message: string): Promise<void> => {
  if (!supabase) return;

  // Get all enrolled students
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('student_id')
    .eq('course_id', courseId);

  if (!enrollments) return;

  // Create notifications for each student
  const notifications = enrollments.map(e => ({
    user_id: e.student_id,
    item_id: courseId,
    item_title: courseTitle,
    item_type: 'course',
    type,
    message,
    is_read: false,
  }));

  await supabase.from('notifications').insert(notifications);
};

export const notifyEnrolledWorkshopStudents = async (workshopId: string, workshopTitle: string, type: Notification['type'], message: string): Promise<void> => {
  if (!supabase) return;

  // Get all enrolled students
  const { data: enrollments } = await supabase
    .from('workshop_enrollments')
    .select('student_id')
    .eq('workshop_id', workshopId);

  if (!enrollments) return;

  // Create notifications for each student
  const notifications = enrollments.map(e => ({
    user_id: e.student_id,
    item_id: workshopId,
    item_title: workshopTitle,
    item_type: 'workshop',
    type,
    message,
    is_read: false,
  }));

  await supabase.from('notifications').insert(notifications);
};
