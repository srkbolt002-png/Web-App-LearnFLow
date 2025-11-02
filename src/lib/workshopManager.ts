import { supabase } from '@/integrations/supabase/client';

export interface WorkshopSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  vimeoLiveUrl?: string;
  isLive: boolean;
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  category: string;
  thumbnail: string;
  sessions: WorkshopSession[];
  enrolledStudents: string[];
  maxStudents: number;
  departmentId?: string;
  createdAt: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export const createWorkshop = async (workshop: Omit<Workshop, 'id' | 'createdAt' | 'enrolledStudents'>): Promise<Workshop | null> => {
  // Ensure department_id is provided (required by schema)
  if (!workshop.departmentId) {
    console.error('department_id is required to create a workshop');
    return null;
  }

  const { data: workshopData, error: workshopError } = await supabase
    .from('workshops')
    .insert({
      title: workshop.title,
      description: workshop.description,
      instructor_id: workshop.instructorId,
      instructor_name: workshop.instructorName,
      category: workshop.category,
      thumbnail: workshop.thumbnail,
      max_students: workshop.maxStudents,
      status: workshop.status,
      department_id: workshop.departmentId,
    })
    .select()
    .single();

  if (workshopError) {
    console.error('Error creating workshop:', workshopError);
    return null;
  }
  
  if (!workshopData) return null;

  // Insert sessions
  const sessionsToInsert = workshop.sessions.map(session => ({
    workshop_id: workshopData.id,
    date: session.date,
    start_time: session.startTime,
    end_time: session.endTime,
    vimeo_live_url: session.vimeoLiveUrl,
    is_live: session.isLive,
  }));

  await supabase.from('workshop_sessions').insert(sessionsToInsert);

  return await getWorkshopById(workshopData.id);
};

export const getWorkshops = async (): Promise<Workshop[]> => {
  const { data: workshops } = await supabase
    .from('workshops')
    .select(`
      *,
      workshop_sessions(*)
    `);

  if (!workshops) return [];

  const workshopIds = workshops.map(w => w.id);
  const { data: enrollments } = await supabase
    .from('workshop_enrollments')
    .select('workshop_id, student_id')
    .in('workshop_id', workshopIds);

  return workshops.map(w => ({
    id: w.id,
    title: w.title,
    description: w.description,
    instructorId: w.instructor_id,
    instructorName: w.instructor_name,
    category: w.category,
    thumbnail: w.thumbnail,
    maxStudents: w.max_students,
    status: w.status,
    departmentId: w.department_id,
    createdAt: w.created_at,
    sessions: (w.workshop_sessions || []).map((s: any) => ({
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      vimeoLiveUrl: s.vimeo_live_url,
      isLive: s.is_live,
    })),
    enrolledStudents: enrollments
      ?.filter((e: any) => e.workshop_id === w.id)
      .map((e: any) => e.student_id) || [],
  }));
};

export const getWorkshopsByDepartment = async (departmentId: string): Promise<Workshop[]> => {
  const { data: workshops } = await supabase
    .from('workshops')
    .select(`
      *,
      workshop_sessions(*)
    `)
    .eq('department_id', departmentId);

  if (!workshops) return [];

  const workshopIds = workshops.map(w => w.id);
  const { data: enrollments } = await supabase
    .from('workshop_enrollments')
    .select('workshop_id, student_id')
    .in('workshop_id', workshopIds);

  return workshops.map(w => ({
    id: w.id,
    title: w.title,
    description: w.description,
    instructorId: w.instructor_id,
    instructorName: w.instructor_name,
    category: w.category,
    thumbnail: w.thumbnail,
    maxStudents: w.max_students,
    status: w.status,
    departmentId: w.department_id,
    createdAt: w.created_at,
    sessions: (w.workshop_sessions || []).map((s: any) => ({
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      vimeoLiveUrl: s.vimeo_live_url,
      isLive: s.is_live,
    })),
    enrolledStudents: enrollments
      ?.filter((e: any) => e.workshop_id === w.id)
      .map((e: any) => e.student_id) || [],
  }));
};

export const getWorkshopById = async (id: string): Promise<Workshop | undefined> => {
  const workshops = await getWorkshops();
  return workshops.find(w => w.id === id);
};

export const getInstructorWorkshops = async (instructorId: string): Promise<Workshop[]> => {
  const workshops = await getWorkshops();
  return workshops.filter(w => w.instructorId === instructorId);
};

export const getEnrolledWorkshops = async (studentId: string): Promise<Workshop[]> => {
  const workshops = await getWorkshops();
  return workshops.filter(w => w.enrolledStudents.includes(studentId));
};

export const enrollInWorkshop = async (workshopId: string, studentId: string): Promise<boolean> => {
  const workshop = await getWorkshopById(workshopId);
  
  if (!workshop) return false;
  if (workshop.enrolledStudents.includes(studentId)) return false;
  if (workshop.enrolledStudents.length >= workshop.maxStudents) return false;

  const { error } = await supabase
    .from('workshop_enrollments')
    .insert({ workshop_id: workshopId, student_id: studentId });

  return !error;
};

export const updateWorkshop = async (workshopId: string, updates: Partial<Workshop>): Promise<boolean> => {
  const { error } = await supabase
    .from('workshops')
    .update({
      title: updates.title,
      description: updates.description,
      category: updates.category,
      thumbnail: updates.thumbnail,
      max_students: updates.maxStudents,
      status: updates.status,
    })
    .eq('id', workshopId);

  if (error) return false;

  // Update sessions if provided
  if (updates.sessions) {
    // Delete existing sessions
    await supabase.from('workshop_sessions').delete().eq('workshop_id', workshopId);
    
    // Insert new sessions
    const sessionsToInsert = updates.sessions.map(session => ({
      id: session.id.startsWith('temp-') ? undefined : session.id,
      workshop_id: workshopId,
      date: session.date,
      start_time: session.startTime,
      end_time: session.endTime,
      vimeo_live_url: session.vimeoLiveUrl,
      is_live: session.isLive,
    }));

    await supabase.from('workshop_sessions').insert(sessionsToInsert);
  }

  return true;
};

export const deleteWorkshop = async (workshopId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('workshops')
    .delete()
    .eq('id', workshopId);

  return !error;
};

export const updateSessionLiveStatus = async (workshopId: string, sessionId: string, isLive: boolean, vimeoLiveUrl?: string): Promise<boolean> => {
  const { error } = await supabase
    .from('workshop_sessions')
    .update({
      is_live: isLive,
      vimeo_live_url: vimeoLiveUrl,
    })
    .eq('id', sessionId);

  return !error;
};
