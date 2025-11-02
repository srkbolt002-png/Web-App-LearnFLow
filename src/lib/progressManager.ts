import { supabase } from '@/integrations/supabase/client';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent: number; // in seconds
  videoWatchTime: number; // in seconds - actual video watched
  lastWatchPosition: number; // in seconds - where user left off
  watchCount: number; // how many times watched
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  enrolledAt: string;
  lastAccessedAt: string;
  totalTimeSpent: number; // in seconds
  lessons: LessonProgress[];
  completionPercentage: number;
  currentStreak: number; // consecutive days of learning
  lastActivityDate?: string;
  achievements: string[];
}

export const initializeCourseProgress = async (userId: string, courseId: string, lessonIds: string[]): Promise<CourseProgress | null> => {
  if (!supabase) return null;

  // Check if progress already exists
  const { data: existing } = await supabase
    .from('course_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    return await getCourseProgress(userId, courseId);
  }

  // Create course progress
  const { data: courseProgressData, error: courseError } = await supabase
    .from('course_progress')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      total_time_spent: 0,
      completion_percentage: 0,
      learning_streak: 1,
      last_activity_date: new Date().toISOString().split('T')[0],
      achievements: [],
    })
    .select()
    .single();

  if (courseError || !courseProgressData) return null;

  // Create lesson progress entries
  const lessonProgressEntries = lessonIds.map(lessonId => ({
    course_progress_id: courseProgressData.id,
    lesson_id: lessonId,
    completed: false,
    time_spent: 0,
    video_watch_time: 0,
    current_position: 0,
  }));

  await supabase.from('lesson_progress').insert(lessonProgressEntries);

  return await getCourseProgress(userId, courseId);
};

export const getCourseProgress = async (userId: string, courseId: string): Promise<CourseProgress | null> => {
  if (!supabase) return null;

  const { data: courseProgress } = await supabase
    .from('course_progress')
    .select(`
      *,
      lesson_progress (*)
    `)
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!courseProgress) return null;

  return {
    courseId: courseProgress.course_id,
    userId: courseProgress.user_id,
    enrolledAt: courseProgress.enrolled_at,
    lastAccessedAt: courseProgress.last_accessed,
    totalTimeSpent: courseProgress.total_time_spent,
    completionPercentage: courseProgress.completion_percentage,
    currentStreak: courseProgress.learning_streak,
    lastActivityDate: courseProgress.last_activity_date,
    achievements: courseProgress.achievements || [],
    lessons: (courseProgress.lesson_progress || []).map((lp: any) => ({
      lessonId: lp.lesson_id,
      completed: lp.completed,
      completedAt: lp.last_watched,
      timeSpent: lp.time_spent,
      videoWatchTime: lp.video_watch_time,
      lastWatchPosition: lp.current_position,
      watchCount: 0, // Not tracked in DB yet
    })),
  };
};

export const getUserProgress = async (userId: string): Promise<CourseProgress[]> => {
  if (!supabase) return [];

  const { data } = await supabase
    .from('course_progress')
    .select(`
      *,
      lesson_progress (*)
    `)
    .eq('user_id', userId);

  if (!data) return [];

  return data.map(cp => ({
    courseId: cp.course_id,
    userId: cp.user_id,
    enrolledAt: cp.enrolled_at,
    lastAccessedAt: cp.last_accessed,
    totalTimeSpent: cp.total_time_spent,
    completionPercentage: cp.completion_percentage,
    currentStreak: cp.learning_streak,
    lastActivityDate: cp.last_activity_date,
    achievements: cp.achievements || [],
    lessons: (cp.lesson_progress || []).map((lp: any) => ({
      lessonId: lp.lesson_id,
      completed: lp.completed,
      completedAt: lp.last_watched,
      timeSpent: lp.time_spent,
      videoWatchTime: lp.video_watch_time,
      lastWatchPosition: lp.current_position,
      watchCount: 0,
    })),
  }));
};

export const updateLessonProgress = async (
  userId: string,
  courseId: string,
  lessonId: string,
  completed: boolean,
  additionalTime: number = 0
) => {
  if (!supabase) return;

  // Get course progress
  const { data: courseProgress } = await supabase
    .from('course_progress')
    .select('id, total_time_spent, learning_streak, last_activity_date, achievements')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (!courseProgress) return;

  // Update lesson progress
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('course_progress_id', courseProgress.id)
    .eq('lesson_id', lessonId)
    .single();

  if (!lessonProgress) return;

  await supabase
    .from('lesson_progress')
    .update({
      completed,
      time_spent: lessonProgress.time_spent + additionalTime,
      last_watched: completed ? new Date().toISOString() : lessonProgress.last_watched,
    })
    .eq('course_progress_id', courseProgress.id)
    .eq('lesson_id', lessonId);

  // Calculate new completion percentage
  const { data: allLessons } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('course_progress_id', courseProgress.id);

  const completedCount = allLessons?.filter(l => l.completed).length || 0;
  const totalLessons = allLessons?.length || 1;
  const newCompletionPercentage = Math.round((completedCount / totalLessons) * 100);

  // Update streak
  const newStreak = calculateNewStreak(courseProgress.last_activity_date);
  const newAchievements = checkAchievements({
    completionPercentage: newCompletionPercentage,
    currentStreak: newStreak,
    totalTimeSpent: courseProgress.total_time_spent + additionalTime,
    lessons: allLessons || [],
    achievements: courseProgress.achievements || [],
  });

  // Update course progress
  await supabase
    .from('course_progress')
    .update({
      last_accessed: new Date().toISOString(),
      last_activity_date: new Date().toISOString().split('T')[0],
      total_time_spent: courseProgress.total_time_spent + additionalTime,
      completion_percentage: newCompletionPercentage,
      learning_streak: newStreak,
      achievements: newAchievements,
    })
    .eq('id', courseProgress.id);
};

export const updateVideoProgress = async (
  userId: string,
  courseId: string,
  lessonId: string,
  watchTime: number,
  currentPosition: number
) => {
  if (!supabase) return;

  const { data: courseProgress } = await supabase
    .from('course_progress')
    .select('id, total_time_spent, learning_streak, last_activity_date')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (!courseProgress) return;

  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('course_progress_id', courseProgress.id)
    .eq('lesson_id', lessonId)
    .single();

  if (!lessonProgress) return;

  await supabase
    .from('lesson_progress')
    .update({
      video_watch_time: lessonProgress.video_watch_time + watchTime,
      current_position: currentPosition,
      time_spent: lessonProgress.time_spent + watchTime,
    })
    .eq('course_progress_id', courseProgress.id)
    .eq('lesson_id', lessonId);

  const newStreak = calculateNewStreak(courseProgress.last_activity_date);

  await supabase
    .from('course_progress')
    .update({
      last_accessed: new Date().toISOString(),
      last_activity_date: new Date().toISOString().split('T')[0],
      total_time_spent: courseProgress.total_time_spent + watchTime,
      learning_streak: newStreak,
    })
    .eq('id', courseProgress.id);
};

export const calculateCompletionPercentage = (lessons: LessonProgress[]): number => {
  if (lessons.length === 0) return 0;
  const completed = lessons.filter(l => l.completed).length;
  return Math.round((completed / lessons.length) * 100);
};

export const formatTimeSpent = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const calculateNewStreak = (lastActivityDate: string | null): number => {
  if (!lastActivityDate) return 1;
  
  const lastActivity = new Date(lastActivityDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastActivity.setHours(0, 0, 0, 0);
  
  const diffInDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Same day, return current streak (will be fetched from DB)
    return 1;
  } else if (diffInDays === 1) {
    // Consecutive day, increase streak (caller should handle this)
    return 1; // Placeholder, caller increments
  } else {
    // Streak broken, reset to 1
    return 1;
  }
};

const checkAchievements = (data: {
  completionPercentage: number;
  currentStreak: number;
  totalTimeSpent: number;
  lessons: any[];
  achievements: string[];
}): string[] => {
  const achievements = [...data.achievements];
  
  // First lesson completed
  if (data.lessons.some(l => l.completed) && !achievements.includes('first_lesson')) {
    achievements.push('first_lesson');
  }
  
  // 5 lessons completed
  const completedCount = data.lessons.filter(l => l.completed).length;
  if (completedCount >= 5 && !achievements.includes('five_lessons')) {
    achievements.push('five_lessons');
  }
  
  // Course completed
  if (data.completionPercentage === 100 && !achievements.includes('course_complete')) {
    achievements.push('course_complete');
  }
  
  // 7 day streak
  if (data.currentStreak >= 7 && !achievements.includes('week_streak')) {
    achievements.push('week_streak');
  }
  
  // 5 hours of learning
  if (data.totalTimeSpent >= 18000 && !achievements.includes('five_hours')) {
    achievements.push('five_hours');
  }
  
  return achievements;
};

export const getAchievementDetails = (achievementId: string) => {
  const achievements: Record<string, { title: string; description: string; icon: string }> = {
    first_lesson: {
      title: 'First Steps',
      description: 'Completed your first lesson',
      icon: '🎯',
    },
    five_lessons: {
      title: 'Knowledge Seeker',
      description: 'Completed 5 lessons',
      icon: '📚',
    },
    course_complete: {
      title: 'Course Master',
      description: 'Completed an entire course',
      icon: '🏆',
    },
    week_streak: {
      title: 'Consistent Learner',
      description: 'Maintained a 7-day learning streak',
      icon: '🔥',
    },
    five_hours: {
      title: 'Time Invested',
      description: 'Spent 5 hours learning',
      icon: '⏰',
    },
  };
  
  return achievements[achievementId] || { title: 'Achievement', description: '', icon: '⭐' };
};
