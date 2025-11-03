import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Edit, X } from 'lucide-react';
import { getAvatarColor } from '@/lib/avatarColors';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getEnrolledCourses, unenrollFromCourse, Course } from '@/lib/courseManager';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const avatarColor = user ? getAvatarColor(user.name) : '';
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadEnrolledCourses();
  }, [user, navigate]);

  const loadEnrolledCourses = async () => {
    if (!user) return;
    const enrolled = await getEnrolledCourses(user.id);
    setEnrolledCourses(enrolled);
  };

  const handleUpdateProfile = () => {
    updateUser(editForm);
    setShowEditDialog(false);
    toast({ title: 'Profile updated!' });
  };

  const handleUnenroll = async (courseId: string, courseTitle: string) => {
    if (!user) return;
    
    if (!confirm(`Are you sure you want to unenroll from "${courseTitle}"?`)) return;

    const success = await unenrollFromCourse(courseId, user.id);
    if (success) {
      toast({ title: 'Successfully unenrolled from course' });
      loadEnrolledCourses();
    } else {
      toast({ 
        title: 'Error', 
        description: 'Failed to unenroll from course',
        variant: 'destructive'
      });
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20" style={{ backgroundColor: avatarColor }}>
                <AvatarFallback className="text-2xl text-black dark:text-white font-bold">
                  {user.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                  <span className="mt-2 inline-block capitalize px-3 py-1 bg-primary/10 text-primary rounded text-sm">
                    {user.role}
                  </span>
                </div>
              </div>
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your profile information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <Button onClick={handleUpdateProfile} className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          {user.bio && (
            <CardContent>
              <p className="text-muted-foreground">{user.bio}</p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Enrolled Courses</CardTitle>
            <CardDescription>Track your learning progress</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledCourses.length > 0 ? (
              <div className="space-y-4">
                {enrolledCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 p-4 border rounded-lg transition-colors"
                  >
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-24 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                      onClick={() => navigate(`/course/${course.id}`)}
                    />
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {course.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUnenroll(course.id, course.title)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Unenroll
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
                <Button onClick={() => navigate('/courses')}>
                  Browse Courses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}