import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
  created_by: string | null;
  is_active: boolean;
  student_id: string | null;
  employee_id: string | null;
  role?: string;
  department?: {
    name: string;
    code: string;
  };
}

export const getUsersByDepartment = async (
  departmentId: string,
  role?: string
): Promise<UserProfile[]> => {
  if (!supabase) return [];

  let query = supabase
    .from('profiles')
    .select(`
      *,
      user_roles(role),
      departments(name, code)
    `)
    .eq('department_id', departmentId)
    .eq('is_active', true);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  const users = (data || []).map((profile: any) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    department_id: profile.department_id,
    created_by: profile.created_by,
    is_active: profile.is_active,
    student_id: profile.student_id,
    employee_id: profile.employee_id,
    role: profile.user_roles?.[0]?.role || 'student',
    department: profile.departments,
  }));

  if (role) {
    return users.filter((u: UserProfile) => u.role === role);
  }

  return users;
};

export const getAllUsers = async (role?: string): Promise<UserProfile[]> => {
  if (!supabase) return [];

  let query = supabase
    .from('profiles')
    .select(`
      *,
      user_roles(role),
      departments(name, code)
    `)
    .eq('is_active', true);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  const users = (data || []).map((profile: any) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    department_id: profile.department_id,
    created_by: profile.created_by,
    is_active: profile.is_active,
    student_id: profile.student_id,
    employee_id: profile.employee_id,
    role: profile.user_roles?.[0]?.role || 'student',
    department: profile.departments,
  }));

  if (role) {
    return users.filter((u: UserProfile) => u.role === role);
  }

  return users;
};

export const getUserById = async (id: string): Promise<UserProfile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles(role),
      departments(name, code)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    department_id: data.department_id,
    created_by: data.created_by,
    is_active: data.is_active,
    student_id: data.student_id,
    employee_id: data.employee_id,
    role: (data as any).user_roles?.[0]?.role || 'student',
    department: (data as any).departments,
  };
};

export const updateUser = async (
  id: string,
  updates: Partial<Pick<UserProfile, 'name' | 'email' | 'is_active' | 'student_id' | 'employee_id'>>
): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating user:', error);
    return false;
  }

  return true;
};

export const deactivateUser = async (id: string): Promise<boolean> => {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating user:', error);
    return false;
  }

  return true;
};

export const getDepartmentAdminDepartment = async (userId: string): Promise<string | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('department_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching department:', error);
    return null;
  }

  return data.department_id;
};
