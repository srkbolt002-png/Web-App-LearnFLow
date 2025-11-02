import { supabase } from '@/integrations/supabase/client';

export interface Certificate {
  id: string;
  workshopId: string;
  workshopTitle: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  issuedAt: string;
}

export const issueCertificates = async (workshopId: string, workshopTitle: string, instructorId: string, instructorName: string, studentIds: string[]): Promise<Certificate[]> => {
  const newCertificates: Certificate[] = [];
  
  // Get student names from profiles
  const { data: students } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', studentIds);

  for (const studentId of studentIds) {
    // Check if certificate already exists
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('workshop_id', workshopId)
      .eq('student_id', studentId)
      .single();
    
    if (!existing) {
      const student = students?.find(s => s.id === studentId);
      
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          workshop_id: workshopId,
          workshop_title: workshopTitle,
          student_id: studentId,
          student_name: student?.name || 'Student',
          instructor_id: instructorId,
          instructor_name: instructorName,
        })
        .select()
        .single();

      if (!error && data) {
        newCertificates.push({
          id: data.id,
          workshopId: data.workshop_id,
          workshopTitle: data.workshop_title,
          studentId: data.student_id,
          studentName: data.student_name,
          instructorId: data.instructor_id,
          instructorName: data.instructor_name,
          issuedAt: data.issued_at,
        });
      }
    }
  }
  
  return newCertificates;
};

export const getCertificates = async (): Promise<Certificate[]> => {
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .order('issued_at', { ascending: false });

  if (!data) return [];

  return data.map(c => ({
    id: c.id,
    workshopId: c.workshop_id,
    workshopTitle: c.workshop_title,
    studentId: c.student_id,
    studentName: c.student_name,
    instructorId: c.instructor_id,
    instructorName: c.instructor_name,
    issuedAt: c.issued_at,
  }));
};

export const getStudentCertificates = async (studentId: string): Promise<Certificate[]> => {
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', studentId)
    .order('issued_at', { ascending: false });

  if (!data) return [];

  return data.map(c => ({
    id: c.id,
    workshopId: c.workshop_id,
    workshopTitle: c.workshop_title,
    studentId: c.student_id,
    studentName: c.student_name,
    instructorId: c.instructor_id,
    instructorName: c.instructor_name,
    issuedAt: c.issued_at,
  }));
};

export const getWorkshopCertificate = async (workshopId: string, studentId: string): Promise<Certificate | undefined> => {
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (!data) return undefined;

  return {
    id: data.id,
    workshopId: data.workshop_id,
    workshopTitle: data.workshop_title,
    studentId: data.student_id,
    studentName: data.student_name,
    instructorId: data.instructor_id,
    instructorName: data.instructor_name,
    issuedAt: data.issued_at,
  };
};

export const hasCertificate = async (workshopId: string, studentId: string): Promise<boolean> => {
  const cert = await getWorkshopCertificate(workshopId, studentId);
  return !!cert;
};
