import { supabase } from '@/integrations/supabase/client';

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

export const createDepartment = async (
  name: string,
  code: string,
  description?: string
): Promise<Department | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('departments')
    .insert({ name, code, description })
    .select()
    .single();

  if (error) {
    console.error('Error creating department:', error);
    return null;
  }

  return data;
};

export const getDepartments = async (): Promise<Department[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching departments:', error);
    return [];
  }

  return data || [];
};

export const getDepartmentById = async (id: string): Promise<Department | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching department:', error);
    return null;
  }

  return data;
};

export const updateDepartment = async (
  id: string,
  updates: Partial<Pick<Department, 'name' | 'code' | 'description'>>
): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating department:', error);
    return false;
  }

  return true;
};

export const deleteDepartment = async (id: string): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting department:', error);
    return false;
  }

  return true;
};

export const getDepartmentStats = async (departmentId: string) => {
  if (!supabase) return null;

  // Get counts for students, instructors, and courses
  const [studentsResult, instructorsResult, coursesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, user_roles!inner(role)', { count: 'exact', head: true })
      .eq('department_id', departmentId)
      .eq('user_roles.role', 'student'),
    supabase
      .from('profiles')
      .select('id, user_roles!inner(role)', { count: 'exact', head: true })
      .eq('department_id', departmentId)
      .eq('user_roles.role', 'instructor'),
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', departmentId)
  ]);

  return {
    students: studentsResult.count || 0,
    instructors: instructorsResult.count || 0,
    courses: coursesResult.count || 0,
  };
};
