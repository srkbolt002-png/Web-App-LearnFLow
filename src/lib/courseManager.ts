import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  category: string;
  level: string;
  duration: string;
  thumbnail: string;
  videoUrl?: string;
  departmentId?: string;
  createdAt: string;
}

export const createCourse = async (course: Omit<Course, 'id' | 'createdAt'>): Promise<Course | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: course.title,
      description: course.description,
      instructor_id: course.instructorId,
      instructor_name: course.instructorName,
      category: course.category,
      level: course.level,
      duration: course.duration,
      thumbnail: course.thumbnail,
      video_url: course.videoUrl,
      department_id: course.departmentId,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    instructorId: data.instructor_id,
    instructorName: data.instructor_name,
    category: data.category,
    level: data.level,
    duration: data.duration,
    thumbnail: data.thumbnail,
    videoUrl: data.video_url,
    departmentId: data.department_id,
    createdAt: data.created_at,
  };
};

export const getCourses = async (): Promise<Course[]> => {
  if (!supabase) return [];

  const { data } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    instructorId: c.instructor_id,
    instructorName: c.instructor_name,
    category: c.category,
    level: c.level,
    duration: c.duration,
    thumbnail: c.thumbnail,
    videoUrl: c.video_url,
    departmentId: c.department_id,
    createdAt: c.created_at,
  }));
};

export const getCoursesByDepartment = async (departmentId: string): Promise<Course[]> => {
  if (!supabase) return [];

  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('department_id', departmentId)
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    instructorId: c.instructor_id,
    instructorName: c.instructor_name,
    category: c.category,
    level: c.level,
    duration: c.duration,
    thumbnail: c.thumbnail,
    videoUrl: c.video_url,
    departmentId: c.department_id,
    createdAt: c.created_at,
  }));
};

export const getCourseById = async (id: string): Promise<Course | undefined> => {
  if (!supabase) return undefined;

  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!data) return undefined;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    instructorId: data.instructor_id,
    instructorName: data.instructor_name,
    category: data.category,
    level: data.level,
    duration: data.duration,
    thumbnail: data.thumbnail,
    videoUrl: data.video_url,
    departmentId: data.department_id,
    createdAt: data.created_at,
  };
};

export const getInstructorCourses = async (instructorId: string): Promise<Course[]> => {
  if (!supabase) return [];

  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    instructorId: c.instructor_id,
    instructorName: c.instructor_name,
    category: c.category,
    level: c.level,
    duration: c.duration,
    thumbnail: c.thumbnail,
    videoUrl: c.video_url,
    departmentId: c.department_id,
    createdAt: c.created_at,
  }));
};

export const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('courses')
    .update({
      title: updates.title,
      description: updates.description,
      category: updates.category,
      level: updates.level,
      duration: updates.duration,
      thumbnail: updates.thumbnail,
      video_url: updates.videoUrl,
    })
    .eq('id', courseId);

  return !error;
};

export const deleteCourse = async (courseId: string): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  return !error;
};

export const enrollInCourse = async (courseId: string, studentId: string): Promise<boolean> => {
  if (!supabase) return false;

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing) return false;

  const { error } = await supabase
    .from('course_enrollments')
    .insert({ course_id: courseId, student_id: studentId });

  return !error;
};

export const isEnrolledInCourse = async (courseId: string, studentId: string): Promise<boolean> => {
  if (!supabase) return false;

  const { data } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', studentId)
    .maybeSingle();

  return !!data;
};

export const getEnrolledCourses = async (studentId: string): Promise<Course[]> => {
  if (!supabase) return [];

  const { data } = await supabase
    .from('course_enrollments')
    .select(`
      course_id,
      courses (*)
    `)
    .eq('student_id', studentId);

  if (!data) return [];

  return data
    .filter(e => e.courses)
    .map((e: any) => ({
      id: e.courses.id,
      title: e.courses.title,
      description: e.courses.description,
      instructorId: e.courses.instructor_id,
      instructorName: e.courses.instructor_name,
      category: e.courses.category,
      level: e.courses.level,
      duration: e.courses.duration,
      thumbnail: e.courses.thumbnail,
      videoUrl: e.courses.video_url,
      departmentId: e.courses.department_id,
      createdAt: e.courses.created_at,
    }));
};

export const getCourseEnrollmentCount = async (courseId: string): Promise<number> => {
  if (!supabase) return 0;

  const { count } = await supabase
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  return count || 0;
};
