import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase, supabaseAdmin } from '@/integrations/supabase/client';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  studentId: z.string().trim().max(50).optional(),
  employeeId: z.string().trim().max(50).optional()
});

interface PrefillData {
  name: string;
  studentId: string;
  departmentId: string;
  requestId?: string;
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
  userType: 'student' | 'instructor';
  onSuccess: () => void;
  prefillData?: PrefillData;
}

export function AddUserDialog({ 
  open, 
  onOpenChange, 
  departmentId, 
  userType,
  onSuccess,
  prefillData
}: AddUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: prefillData?.name || '',
    email: prefillData ? `${prefillData.studentId.toLowerCase()}${prefillData.name.toLowerCase().replace(/\s+/g, '')}@student.com` : '',
    password: '12345678',
    studentId: prefillData?.studentId || '',
    employeeId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when prefillData changes
  useEffect(() => {
    if (prefillData) {
      setFormData({
        name: prefillData.name,
        email: `${prefillData.studentId.toLowerCase()}${prefillData.name.toLowerCase().replace(/\s+/g, '')}@student.com`,
        password: '12345678',
        studentId: prefillData.studentId,
        employeeId: ''
      });
      setIsEditing(false);
    } else {
      setFormData({
        name: '',
        email: '',
        password: '12345678',
        studentId: '',
        employeeId: ''
      });
      setIsEditing(false);
    }
  }, [prefillData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = userSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Database not available',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Check for duplicate student_id or employee_id
      if (userType === 'student' && formData.studentId) {
        const { data: existingStudent } = await supabase
          .from('profiles')
          .select('id')
          .eq('student_id', formData.studentId)
          .maybeSingle();
        
        if (existingStudent) {
          toast({
            title: 'Error',
            description: 'A student with this ID already exists',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      if (userType === 'instructor' && formData.employeeId) {
        const { data: existingInstructor } = await supabase
          .from('profiles')
          .select('id')
          .eq('employee_id', formData.employeeId)
          .maybeSingle();
        
        if (existingInstructor) {
          toast({
            title: 'Error',
            description: 'An instructor with this Employee ID already exists',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      // Create auth user using admin API to prevent auto-login
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update profile with department and IDs
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          department_id: departmentId,
          student_id: userType === 'student' ? formData.studentId : null,
          employee_id: userType === 'instructor' ? formData.employeeId : null,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Set user role
      await supabase.from('user_roles').delete().eq('user_id', authData.user.id);
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: authData.user.id, 
          role: userType 
        });

      if (roleError) throw roleError;

      // Mark request as completed if it came from a request
      if (prefillData?.requestId) {
        await supabase
          .from('student_information_requests')
          .update({ status: 'completed' })
          .eq('id', prefillData.requestId);
      }

      toast({
        title: 'Success',
        description: `${userType === 'student' ? 'Student' : 'Instructor'} added successfully. Email: ${formData.email}, Password: ${formData.password}`
      });

      setFormData({
        name: '',
        email: '',
        password: '12345678',
        studentId: '',
        employeeId: ''
      });
      setIsEditing(false);
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to add ${userType}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add {userType === 'student' ? 'Student' : 'Instructor'}</span>
            {prefillData && !isEditing && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              disabled={!!prefillData && !isEditing}
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
              disabled={!!prefillData && !isEditing}
            />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label>Password *</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              disabled={!!prefillData && !isEditing}
            />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
            {!isEditing && (
              <p className="text-xs text-muted-foreground mt-1">Default password: 12345678</p>
            )}
          </div>

          {userType === 'student' && (
            <div>
              <Label>Student ID *</Label>
              <Input
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                placeholder="CS001"
                required
                disabled={!!prefillData && !isEditing}
              />
              {errors.studentId && <p className="text-sm text-destructive mt-1">{errors.studentId}</p>}
            </div>
          )}

          {userType === 'instructor' && (
            <div>
              <Label>Employee ID</Label>
              <Input
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="EMP-12345"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
