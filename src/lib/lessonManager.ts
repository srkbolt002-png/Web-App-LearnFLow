import { supabase } from '@/integrations/supabase/client';

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  /** @deprecated Use videoStoragePath instead. Kept for backward compatibility. */
  videoUrl: string;
  /** Supabase Storage path for video file in 'lesson-videos' bucket. This is the preferred field. */
  videoStoragePath?: string;
  duration: string;
  orderIndex: number;
  createdAt: string;
}

export const createLesson = async (lesson: Omit<Lesson, 'id' | 'createdAt'>): Promise<Lesson | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      course_id: lesson.courseId,
      title: lesson.title,
      description: lesson.description,
      video_url: lesson.videoUrl,
      video_storage_path: lesson.videoStoragePath,
      duration: lesson.duration,
      order_index: lesson.orderIndex,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    courseId: data.course_id,
    title: data.title,
    description: data.description,
    videoUrl: data.video_url,
    videoStoragePath: data.video_storage_path,
    duration: data.duration,
    orderIndex: data.order_index,
    createdAt: data.created_at,
  };
};

export const getCourseLessons = async (courseId: string): Promise<Lesson[]> => {
  if (!supabase) return [];

  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (!data) return [];

  return data.map(l => ({
    id: l.id,
    courseId: l.course_id,
    title: l.title,
    description: l.description,
    videoUrl: l.video_url,
    videoStoragePath: l.video_storage_path,
    duration: l.duration,
    orderIndex: l.order_index,
    createdAt: l.created_at,
  }));
};

export const getLessonById = async (id: string): Promise<Lesson | undefined> => {
  if (!supabase) return undefined;

  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!data) return undefined;

  return {
    id: data.id,
    courseId: data.course_id,
    title: data.title,
    description: data.description,
    videoUrl: data.video_url,
    videoStoragePath: data.video_storage_path,
    duration: data.duration,
    orderIndex: data.order_index,
    createdAt: data.created_at,
  };
};

export const updateLesson = async (lessonId: string, updates: Partial<Lesson>): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('lessons')
    .update({
      title: updates.title,
      description: updates.description,
      video_url: updates.videoUrl,
      video_storage_path: updates.videoStoragePath,
      duration: updates.duration,
      order_index: updates.orderIndex,
    })
    .eq('id', lessonId);

  return !error;
};

export const deleteLesson = async (lessonId: string): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  return !error;
};

export const reorderLessons = async (courseId: string, lessonIds: string[]): Promise<boolean> => {
  if (!supabase) return false;

  // Update order_index for each lesson
  const updates = lessonIds.map((lessonId, index) =>
    supabase
      .from('lessons')
      .update({ order_index: index + 1 })
      .eq('id', lessonId)
      .eq('course_id', courseId)
  );

  const results = await Promise.all(updates);
  return results.every(r => !r.error);
};
