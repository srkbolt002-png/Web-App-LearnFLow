import { supabase } from '@/integrations/supabase/client';

export interface InstructorApplication {
  id: string;
  user_id: string;
  reason: string;
  experience: string;
  expertise: string;
  qualifications: string;
  course_idea: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface InstructorApplicationWithProfile extends InstructorApplication {
  profile: {
    name: string;
    email: string;
  };
}

/**
 * Creates a new instructor application
 */
export async function createApplication(
  userId: string,
  data: {
    reason: string;
    experience: string;
    expertise: string;
    qualifications: string;
    courseIdea: string;
  }
) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: application, error } = await supabase
    .from('instructor_applications')
    .insert({
      user_id: userId,
      reason: data.reason,
      experience: data.experience,
      expertise: data.expertise,
      qualifications: data.qualifications,
      course_idea: data.courseIdea,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return application;
}

/**
 * Gets all instructor applications with user profiles
 */
export async function getApplications(): Promise<InstructorApplicationWithProfile[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('instructor_applications')
    .select(`
      *,
      profile:profiles!user_id(name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any;
}

/**
 * Gets a user's instructor application
 */
export async function getUserApplication(userId: string): Promise<InstructorApplication | null> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('instructor_applications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Approves an instructor application and grants instructor role
 */
export async function approveApplication(applicationId: string, userId: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Update application status
  const { error: updateError } = await supabase
    .from('instructor_applications')
    .update({ 
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  if (updateError) throw updateError;

  // Remove student role
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  // Add instructor role
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({ 
      user_id: userId, 
      role: 'instructor' 
    });

  if (insertError) throw insertError;

  return { success: true };
}

/**
 * Rejects an instructor application
 */
export async function rejectApplication(applicationId: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase
    .from('instructor_applications')
    .update({ 
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  if (error) throw error;
  return { success: true };
}
