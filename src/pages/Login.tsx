import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Mail, IdCard } from 'lucide-react';

export default function Login() {
  const [loginMode, setLoginMode] = useState<'email' | 'studentId'>('email');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithStudentId, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigateBasedOnRole(user.role);
    }
  }, [user]);

  const navigateBasedOnRole = (role: string) => {
    toast({ title: 'Welcome back!' });
    
    switch(role) {
      case 'super_admin':
        navigate('/super-admin', { replace: true });
        break;
      case 'department_admin':
        navigate('/department-admin', { replace: true });
        break;
      case 'instructor':
        navigate('/instructor/home', { replace: true });
        break;
      case 'student':
        navigate('/student/dashboard', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    let error: string | null = null;
    
    if (loginMode === 'email') {
      const result = await login(email, password);
      error = result.error;
    } else {
      const result = await loginWithStudentId(studentId, password);
      error = result.error;
    }
    
    if (error) {
      setIsLoading(false);
      toast({ 
        title: 'Login failed', 
        description: error || 'Invalid credentials',
        variant: 'destructive'
      });
    }
    // Don't set isLoading to false on success - navigation will happen via useEffect
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      
      <Card className="w-full max-w-md relative z-10 border-2 card-glass shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl educational-gradient shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-display font-bold">Welcome to LearnFlow</CardTitle>
          <CardDescription className="text-base">Sign in to continue your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginMode} onValueChange={(v) => setLoginMode(v as 'email' | 'studentId')} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="studentId" className="flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Student ID
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="mt-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-2"
                  />
                </div>
                <Button type="submit" variant="glow" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Continue'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="studentId" className="mt-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-sm font-medium">Student ID</Label>
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="CS001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    required
                    className="h-11 border-2"
                  />
                  <p className="text-xs text-muted-foreground">Enter your Student ID (e.g., CS001, EE042)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-student" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password-student"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-2"
                  />
                </div>
                <Button type="submit" variant="glow" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Continue'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:text-primary-glow font-semibold hover:underline">
              Sign up
            </Link>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground border border-border/50">
            <p className="font-semibold mb-2 text-foreground">Demo Accounts:</p>
            <div className="space-y-1">
              <p><span className="font-medium">Super Admin:</span> super@admin.com / 12345678</p>
              <p><span className="font-medium">CS Admin:</span> cs-admin@test.com / 12345678</p>
              <p><span className="font-medium">CS Instructor:</span> cs-instructor@test.com / 12345678</p>
              <p><span className="font-medium">Student (Email):</span> student1@test.com / 12345678</p>
              <p><span className="font-medium">Student (ID):</span> CS001 / 12345678</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
