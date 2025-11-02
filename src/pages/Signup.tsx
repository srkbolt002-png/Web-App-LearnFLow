import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const studentRequestSchema = z.object({
  name: z.string().trim().min(2, {
    message: "Name must be at least 2 characters"
  }).max(100, {
    message: "Name must be less than 100 characters"
  }),
  departmentId: z.string().uuid({
    message: "Please select a department"
  }),
  studentId: z.string().trim().min(3, {
    message: "Student ID is required (e.g., CS001)"
  }).max(50, {
    message: "Student ID must be less than 50 characters"
  }).regex(/^[A-Z]{2,4}[0-9]+$/, {
    message: "Student ID must start with department code (e.g., CS001, EE042)"
  })
});

interface Department {
  id: string;
  name: string;
}

export default function Signup() {
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Failed to load departments:', error);
    } else {
      setDepartments(data || []);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate fields
    try {
      studentRequestSchema.parse({
        name,
        departmentId,
        studentId
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Database connection not available',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Check if student ID already exists
      const { data: existingRequests } = await supabase
        .from('student_information_requests')
        .select('student_id, status')
        .eq('student_id', studentId);

      if (existingRequests && existingRequests.length > 0) {
        const pendingRequest = existingRequests.find(r => r.status === 'pending');
        if (pendingRequest) {
          toast({
            title: 'Request already exists',
            description: 'A request with this Student ID already exists. Please contact your department admin.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      // Insert request into database
      const { error: insertError } = await supabase
        .from('student_information_requests')
        .insert({
          name,
          department_id: departmentId,
          student_id: studentId,
          status: 'pending'
        });

      if (insertError) {
        console.error('Failed to submit request:', insertError);
        toast({
          title: 'Error',
          description: insertError.message || 'Failed to submit request. Please try again.',
          variant: 'destructive'
        });
      } else {
        setSubmitted(true);
        toast({
          title: 'Request submitted!',
          description: 'Your information has been sent to the department admin.'
        });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 hero-gradient">
        <Card className="w-full max-w-md card-glass">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl educational-gradient shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gradient">Information Submitted!</CardTitle>
            <CardDescription className="text-base mt-4">
              Your information has been submitted successfully. 
              Please contact your department admin to get your login credentials (email and password).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center pt-4">
              <Link to="/login">
                <Button variant="glow" size="lg" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 hero-gradient">
      <Card className="w-full max-w-md card-glass">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl educational-gradient shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient">Student Registration</CardTitle>
          <CardDescription className="text-base">
            Submit your information to register. Your department admin will create your account and provide login credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className={`h-11 border-2 ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium">Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} required>
                <SelectTrigger className={`h-11 border-2 ${errors.departmentId ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-sm font-medium">
                Student ID *
              </Label>
              <Input 
                id="studentId" 
                type="text" 
                placeholder="CS001 (Department code + number)" 
                value={studentId} 
                onChange={e => setStudentId(e.target.value.toUpperCase())} 
                required
                className={`h-11 border-2 ${errors.studentId ? 'border-destructive' : ''}`}
              />
              {errors.studentId && <p className="text-xs text-destructive">{errors.studentId}</p>}
              <p className="text-xs text-muted-foreground">Format: Department code followed by numbers (e.g., CS001, EE042)</p>
            </div>

            <Button 
              type="submit" 
              variant="glow" 
              size="lg" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Information'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:text-primary-glow font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}