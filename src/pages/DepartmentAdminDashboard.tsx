import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, GraduationCap, UserPlus, Edit, Trash2, ExternalLink, Clock, UserCheck } from 'lucide-react';
import { AddUserDialog } from '@/components/AddUserDialog';
import { EditUserDialog } from '@/components/EditUserDialog';
import { deactivateUser } from '@/lib/userManager';
import { deleteCourse } from '@/lib/courseManager';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { 
  getUsersByDepartment, 
  getDepartmentAdminDepartment,
  UserProfile 
} from '@/lib/userManager';
import { getCoursesByDepartment, Course } from '@/lib/courseManager';
import { getDepartmentById, Department } from '@/lib/departmentManager';
import { supabase } from '@/integrations/supabase/client';

interface StudentInformationRequest {
  id: string;
  name: string;
  student_id: string;
  status: 'pending' | 'completed';
  created_at: string;
  department_id: string;
}

export default function DepartmentAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const routerNavigate = useRouterNavigate();
  const { toast } = useToast();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [instructors, setInstructors] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [infoRequests, setInfoRequests] = useState<StudentInformationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showAddInstructorDialog, setShowAddInstructorDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRequestForCreation, setSelectedRequestForCreation] = useState<StudentInformationRequest | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'department_admin') {
      toast({
        title: "Access Denied",
        description: `You must be a department admin to access this page. Your current role: ${user.role}`,
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const deptId = await getDepartmentAdminDepartment(user.id);
      
      if (!deptId) {
        toast({
          title: "Department Not Found",
          description: `Your account (${user.email}) is not linked to a department. Please run the setup_demo_hierarchy() function in your database or contact an administrator.`,
          variant: "destructive",
        });
        console.error('Department admin user details:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          message: 'No department_id found in profiles table'
        });
        return;
      }

      const [deptData, allUsers, coursesData, requestsData] = await Promise.all([
        getDepartmentById(deptId),
        getUsersByDepartment(deptId),
        getCoursesByDepartment(deptId),
        supabase!.from('student_information_requests')
          .select('*')
          .eq('department_id', deptId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
      ]);

      setDepartment(deptData);
      setStudents(allUsers.filter(u => u.role === 'student'));
      setInstructors(allUsers.filter(u => u.role === 'instructor'));
      setCourses(coursesData);
      setInfoRequests(requestsData.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    const success = await deactivateUser(userId);
    if (success) {
      toast({
        title: 'User deactivated',
        description: 'User has been deactivated successfully'
      });
      loadData();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to deactivate user',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    const success = await deleteCourse(courseId);
    if (success) {
      toast({ title: 'Course deleted successfully' });
      loadData();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive'
      });
    }
  };

  const handleCreateAccountFromRequest = (request: StudentInformationRequest) => {
    setSelectedRequestForCreation(request);
    setShowAddStudentDialog(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!supabase || !user) return;
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const { error } = await supabase
        .from('student_information_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request Deleted',
        description: 'The student information request has been deleted'
      });
      
      loadData();
    } catch (error: any) {
      console.error('Failed to delete request:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete request',
        variant: 'destructive'
      });
    }
  };

  if (!user || user.role !== 'department_admin') return null;

  return (
    <>
      <AddUserDialog
        open={showAddStudentDialog}
        onOpenChange={(open) => {
          setShowAddStudentDialog(open);
          if (!open) setSelectedRequestForCreation(null);
        }}
        departmentId={department?.id || ''}
        userType="student"
        onSuccess={loadData}
        prefillData={selectedRequestForCreation ? {
          name: selectedRequestForCreation.name,
          studentId: selectedRequestForCreation.student_id,
          departmentId: selectedRequestForCreation.department_id,
          requestId: selectedRequestForCreation.id
        } : undefined}
      />
      
      <AddUserDialog
        open={showAddInstructorDialog}
        onOpenChange={setShowAddInstructorDialog}
        departmentId={department?.id || ''}
        userType="instructor"
        onSuccess={loadData}
      />

      <EditUserDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={selectedUser}
        onSuccess={loadData}
      />

    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {department?.name || 'Department'} Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your department's students, instructors, and courses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Student Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{infoRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">
            Student Requests
            {infoRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                {infoRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Student Information Requests</CardTitle>
              <CardDescription>Create accounts for students who have submitted their information</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading requests...</div>
              ) : infoRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {infoRequests.map(request => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.name}</TableCell>
                        <TableCell>
                          <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                            {request.student_id}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleCreateAccountFromRequest(request)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Create Account
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRequest(request.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage department students</CardDescription>
                </div>
                <Button onClick={() => setShowAddStudentDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.student_id || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                            {student.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeactivateUser(student.id)}
                              disabled={!student.is_active}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Instructors</CardTitle>
                  <CardDescription>Manage department instructors</CardDescription>
                </div>
                <Button onClick={() => setShowAddInstructorDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Instructor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading instructors...</div>
              ) : instructors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No instructors yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructors.map(instructor => (
                      <TableRow key={instructor.id}>
                        <TableCell className="font-medium">{instructor.name}</TableCell>
                        <TableCell>{instructor.email}</TableCell>
                        <TableCell>{instructor.employee_id || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                            {instructor.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(instructor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeactivateUser(instructor.id)}
                              disabled={!instructor.is_active}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>All courses in your department</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading courses...</div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No courses yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.instructorName}</TableCell>
                        <TableCell>
                          <span className="capitalize px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                            {course.level}
                          </span>
                        </TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => routerNavigate(`/course/${course.id}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
