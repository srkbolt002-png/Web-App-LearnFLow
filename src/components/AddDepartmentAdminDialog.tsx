import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase, supabaseAdmin } from '@/integrations/supabase/client';
import { z } from 'zod';

interface AddDepartmentAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Array<{ id: string; name: string; code: string }>;
  onSuccess: () => void;
}

const adminSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  departmentId: z.string().min(1, 'Department is required'),
  employeeId: z.string().trim().max(50).optional()
});

export function AddDepartmentAdminDialog({ 
  open, 
  onOpenChange, 
  departments,
  onSuccess 
}: AddDepartmentAdminDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    employeeId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = adminSchema.safeParse(formData);
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

      // Update profile with department and employee ID
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          department_id: formData.departmentId,
          employee_id: formData.employeeId || null,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Set user role as department_admin
      await supabase.from('user_roles').delete().eq('user_id', authData.user.id);
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: authData.user.id, 
          role: 'department_admin' 
        });

      if (roleError) throw roleError;

      toast({
        title: 'Success',
        description: 'Department admin created successfully'
      });

      setFormData({
        name: '',
        email: '',
        password: '',
        departmentId: '',
        employeeId: ''
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding department admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create department admin',
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
          <DialogTitle>Create Department Admin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@example.com"
              required
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
            />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
          </div>

          <div>
            <Label>Department *</Label>
            <Select 
              value={formData.departmentId} 
              onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && <p className="text-sm text-destructive mt-1">{errors.departmentId}</p>}
          </div>

          <div>
            <Label>Employee ID</Label>
            <Input
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="EMP-12345"
            />
            {errors.employeeId && <p className="text-sm text-destructive mt-1">{errors.employeeId}</p>}
          </div>

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
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
