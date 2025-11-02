import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/lib/mockData';
import { getApplications, approveApplication, rejectApplication, InstructorApplicationWithProfile } from '@/lib/instructorApplicationManager';
import { getCourses, deleteCourse, Course } from '@/lib/courseManager';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Trash2 } from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<InstructorApplicationWithProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load applications
      const apps = await getApplications();
      setApplications(apps);

      // Load courses
      const coursesData = await getCourses();
      setCourses(coursesData);

      // Load users from profiles with roles
      if (supabase) {
        const { data: profilesData, error } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            user_roles(role)
          `);

        if (error) throw error;

        const usersData = profilesData?.map(profile => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: (profile.user_roles as any)?.[0]?.role || 'student'
        })) || [];

        setUsers(usersData as User[]);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin panel data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    try {
      await approveApplication(appId, app.user_id);
      toast({ title: 'Application approved!' });
      loadData(); // Reload data
    } catch (error) {
      console.error('Failed to approve application:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve application',
        variant: 'destructive'
      });
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      await rejectApplication(appId);
      toast({ title: 'Application rejected' });
      loadData(); // Reload data
    } catch (error) {
      console.error('Failed to reject application:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject application',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      toast({ title: 'Course deleted' });
      loadData(); // Reload data
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!supabase) return;

    try {
      // This will cascade delete profile and all related data
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({ title: 'User deleted' });
      loadData(); // Reload data
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const pendingApplications = applications.filter(a => a.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="applications">
            Instructor Applications
            {pendingApplications.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {pendingApplications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Applications</CardTitle>
              <CardDescription>Review and approve instructor applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No instructor applications yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => (
                      <Card key={app.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{app.profile?.name}</CardTitle>
                              <CardDescription>{app.profile?.email}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  app.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : app.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {app.status}
                              </span>
                              {app.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveApplication(app.id)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectApplication(app.id)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Why they want to teach:</h4>
                            <p className="text-sm text-muted-foreground">{app.reason}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Teaching Experience:</h4>
                            <p className="text-sm text-muted-foreground">{app.experience}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Area of Expertise:</h4>
                              <p className="text-sm text-muted-foreground">{app.expertise}</p>
                            </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Submitted:</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm mb-1">Qualifications:</h4>
                            <p className="text-sm text-muted-foreground">{app.qualifications}</p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm mb-1">First Course Idea:</h4>
                            <p className="text-sm text-muted-foreground">{app.course_idea}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>All Courses</CardTitle>
              <CardDescription>Manage all courses on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No courses available yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map(course => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{course.instructorName}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className="capitalize px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.id !== user.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}