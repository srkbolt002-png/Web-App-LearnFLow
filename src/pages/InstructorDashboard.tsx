import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { notifyEnrolledStudents } from '@/lib/notificationManager';
import { createCourse, getInstructorCourses, updateCourse, deleteCourse, getCourseEnrollmentCount, Course } from '@/lib/courseManager';
import { createLesson, getCourseLessons, updateLesson, deleteLesson, reorderLessons } from '@/lib/lessonManager';
import { VideoUpload } from '@/components/VideoUpload';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<(Course & { enrollmentCount?: number })[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    thumbnail: '',
    category: '',
    duration: '',
    difficulty: 'beginner' as const,
    lessons: [{ title: '', description: '', videoStoragePath: '', duration: '' }],
  });

  const [editCourse, setEditCourse] = useState<{
    title: string;
    description: string;
    thumbnail: string;
    category: string;
    duration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    lessons: { id?: string; title: string; description: string; videoStoragePath?: string; duration: string }[];
  }>({
    title: '',
    description: '',
    thumbnail: '',
    category: '',
    duration: '',
    difficulty: 'beginner',
    lessons: [{ title: '', description: '', videoStoragePath: '', duration: '' }],
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'instructor') {
      loadCourses();
    }
  }, [user, navigate]);

  const loadCourses = async () => {
    if (!user) return;
    setLoading(true);
    const instructorCourses = await getInstructorCourses(user.id);
    
    // Get enrollment counts
    const coursesWithCounts = await Promise.all(
      instructorCourses.map(async (course) => {
        const count = await getCourseEnrollmentCount(course.id);
        return { ...course, enrollmentCount: count };
      })
    );
    
    setCourses(coursesWithCounts);
    setLoading(false);
  };

  const handleCreateCourse = async () => {
    if (!user || !user.departmentId) {
      toast({ title: 'Error', description: 'User information missing', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const createdCourse = await createCourse({
      title: newCourse.title,
      description: newCourse.description,
      instructorId: user.id,
      instructorName: user.name,
      category: newCourse.category,
      level: newCourse.difficulty,
      duration: newCourse.duration,
      thumbnail: newCourse.thumbnail,
      departmentId: user.departmentId,
    });

    if (createdCourse) {
      // Create lessons
      const validLessons = newCourse.lessons.filter(l => l.title.trim() && l.videoStoragePath?.trim());
      for (let i = 0; i < validLessons.length; i++) {
        await createLesson({
          courseId: createdCourse.id,
          title: validLessons[i].title,
          description: validLessons[i].description,
          videoUrl: '',
          videoStoragePath: validLessons[i].videoStoragePath,
          duration: validLessons[i].duration,
          orderIndex: i + 1,
        });
      }

      await loadCourses();
      setShowCreateDialog(false);
      setNewCourse({
        title: '',
        description: '',
        thumbnail: '',
        category: '',
        duration: '',
        difficulty: 'beginner',
        lessons: [{ title: '', description: '', videoStoragePath: '', duration: '' }],
      });
      toast({ title: 'Course created successfully!' });
    } else {
      toast({ title: 'Error', description: 'Failed to create course', variant: 'destructive' });
    }
    setLoading(false);
  };

  const addLesson = (isEdit: boolean = false) => {
    const newLesson = { title: '', description: '', videoStoragePath: '', duration: '' };
    if (isEdit) {
      setEditCourse({ ...editCourse, lessons: [...editCourse.lessons, newLesson] });
    } else {
      setNewCourse({ ...newCourse, lessons: [...newCourse.lessons, newLesson] });
    }
  };

  const removeLesson = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditCourse({ 
        ...editCourse, 
        lessons: editCourse.lessons.filter((_, i) => i !== index) 
      });
    } else {
      setNewCourse({ 
        ...newCourse, 
        lessons: newCourse.lessons.filter((_, i) => i !== index) 
      });
    }
  };

  const updateLessonField = (index: number, field: string, value: string, isEdit: boolean = false) => {
    if (isEdit) {
      const updatedLessons = [...editCourse.lessons];
      updatedLessons[index] = { ...updatedLessons[index], [field]: value };
      setEditCourse({ ...editCourse, lessons: updatedLessons });
    } else {
      const updatedLessons = [...newCourse.lessons];
      updatedLessons[index] = { ...updatedLessons[index], [field]: value };
      setNewCourse({ ...newCourse, lessons: updatedLessons });
    }
  };

  const handleEditClick = async (course: Course) => {
    setEditingCourse(course);
    
    // Load lessons from database
    const lessons = await getCourseLessons(course.id);
    
    setEditCourse({
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      category: course.category,
      duration: course.duration,
      difficulty: course.level as 'beginner' | 'intermediate' | 'advanced',
      lessons: lessons.length > 0 
        ? lessons.map(l => ({
            id: l.id,
            title: l.title, 
            description: l.description || '', 
            videoStoragePath: l.videoStoragePath || '',
            duration: l.duration || '',
          }))
        : [{ title: '', description: '', videoStoragePath: '', duration: '' }],
    });
    setShowEditDialog(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    setLoading(true);
    const success = await updateCourse(editingCourse.id, {
      title: editCourse.title,
      description: editCourse.description,
      category: editCourse.category,
      level: editCourse.difficulty,
      duration: editCourse.duration,
      thumbnail: editCourse.thumbnail,
    });

    if (success) {
      // Get existing lessons
      const existingLessons = await getCourseLessons(editingCourse.id);
      const validLessons = editCourse.lessons.filter(l => l.title.trim() && l.videoStoragePath?.trim());

      // Update or create lessons
      for (let i = 0; i < validLessons.length; i++) {
        const lesson = validLessons[i];
        if (lesson.id && existingLessons.find(l => l.id === lesson.id)) {
          // Update existing lesson
          await updateLesson(lesson.id, {
            title: lesson.title,
            description: lesson.description,
            videoUrl: '',
            videoStoragePath: lesson.videoStoragePath,
            duration: lesson.duration,
            orderIndex: i + 1,
          });
        } else {
          // Create new lesson
          await createLesson({
            courseId: editingCourse.id,
            title: lesson.title,
            description: lesson.description,
            videoUrl: '',
            videoStoragePath: lesson.videoStoragePath,
            duration: lesson.duration,
            orderIndex: i + 1,
          });
        }
      }

      // Delete lessons that were removed
      const lessonIdsToKeep = validLessons.filter(l => l.id).map(l => l.id!);
      for (const existingLesson of existingLessons) {
        if (!lessonIdsToKeep.includes(existingLesson.id)) {
          await deleteLesson(existingLesson.id);
        }
      }

      // Notify enrolled students
      await notifyEnrolledStudents(
        editingCourse.id,
        editCourse.title,
        'course_update',
        `${editCourse.title} has been updated with new content!`
      );

      await loadCourses();
      setShowEditDialog(false);
      setEditingCourse(null);
      toast({ title: 'Course updated successfully!' });
    } else {
      toast({ title: 'Error', description: 'Failed to update course', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDeleteCourse = async () => {
    if (!editingCourse) return;

    setLoading(true);
    const success = await deleteCourse(editingCourse.id);
    
    if (success) {
      await loadCourses();
      setShowEditDialog(false);
      setEditingCourse(null);
      toast({ title: 'Course deleted' });
    } else {
      toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' });
    }
    setLoading(false);
  };

  if (!user || user.role !== 'instructor') {
    navigate('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Instructor Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl">Create New Course</DialogTitle>
              <DialogDescription className="text-base">Fill in the course details and add lessons</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-6 py-4">
                {/* Course Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Course Information</h3>
                  <div className="space-y-4 bg-accent/30 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Title *</Label>
                      <Input
                        value={newCourse.title}
                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                        placeholder="e.g., Advanced Web Development"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Description *</Label>
                      <Textarea
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                        placeholder="Describe what students will learn..."
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Thumbnail URL</Label>
                      <Input
                        value={newCourse.thumbnail}
                        onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Course Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-accent/30 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Category *</Label>
                      <Input
                        value={newCourse.category}
                        onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                        placeholder="e.g., Programming"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Duration *</Label>
                      <Input
                        value={newCourse.duration}
                        onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                        placeholder="e.g., 4 weeks"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Difficulty *</Label>
                      <Select
                        value={newCourse.difficulty}
                        onValueChange={(v: any) => setNewCourse({ ...newCourse, difficulty: v })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Lessons Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Lessons</h3>
                      <p className="text-xs text-muted-foreground mt-1">Add video lessons to your course</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => addLesson(false)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Lesson
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newCourse.lessons.map((lesson, index) => (
                      <div key={index} className="bg-card border-2 border-border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{index + 1}</span>
                            </div>
                            <span className="text-sm font-medium">Lesson {index + 1}</span>
                          </div>
                          {newCourse.lessons.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLesson(index, false)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Lesson Title *</Label>
                            <Input
                              placeholder="e.g., Introduction to React Hooks"
                              value={lesson.title}
                              onChange={(e) => updateLessonField(index, 'title', e.target.value, false)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Video Upload *</Label>
                            <VideoUpload
                              lessonId={`new-lesson-${index}`}
                              existingPath={lesson.videoStoragePath}
                              onUploadComplete={(path) => updateLessonField(index, 'videoStoragePath', path, false)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Duration</Label>
                            <Input
                              placeholder="e.g., 15:30"
                              value={lesson.duration}
                              onChange={(e) => updateLessonField(index, 'duration', e.target.value, false)}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer with Action Button */}
            <div className="border-t pt-4 mt-4">
              <Button onClick={handleCreateCourse} className="w-full h-11 text-base" disabled={loading}>
                {loading ? 'Creating Course...' : 'Create Course'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl">Edit Course</DialogTitle>
              <DialogDescription className="text-base">Update your course details and manage lessons</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-6 py-4">
                {/* Course Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Course Information</h3>
                  <div className="space-y-4 bg-accent/30 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Title *</Label>
                      <Input
                        value={editCourse.title}
                        onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                        placeholder="e.g., Advanced Web Development"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Description *</Label>
                      <Textarea
                        value={editCourse.description}
                        onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                        placeholder="Describe what students will learn..."
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Thumbnail URL</Label>
                      <Input
                        value={editCourse.thumbnail}
                        onChange={(e) => setEditCourse({ ...editCourse, thumbnail: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Course Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-accent/30 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Category *</Label>
                      <Input
                        value={editCourse.category}
                        onChange={(e) => setEditCourse({ ...editCourse, category: e.target.value })}
                        placeholder="e.g., Programming"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Duration *</Label>
                      <Input
                        value={editCourse.duration}
                        onChange={(e) => setEditCourse({ ...editCourse, duration: e.target.value })}
                        placeholder="e.g., 4 weeks"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Difficulty *</Label>
                      <Select
                        value={editCourse.difficulty}
                        onValueChange={(v: any) => setEditCourse({ ...editCourse, difficulty: v })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Lessons Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Lessons</h3>
                      <p className="text-xs text-muted-foreground mt-1">Manage your course lessons</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => addLesson(true)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Lesson
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {editCourse.lessons.map((lesson, index) => (
                      <div key={index} className="bg-card border-2 border-border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{index + 1}</span>
                            </div>
                            <span className="text-sm font-medium">Lesson {index + 1}</span>
                          </div>
                          {editCourse.lessons.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLesson(index, true)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Lesson Title *</Label>
                            <Input
                              placeholder="e.g., Introduction to React Hooks"
                              value={lesson.title}
                              onChange={(e) => updateLessonField(index, 'title', e.target.value, true)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Video Upload *</Label>
                            <VideoUpload
                              lessonId={lesson.id || `edit-lesson-${index}`}
                              existingPath={lesson.videoStoragePath}
                              onUploadComplete={(path) => updateLessonField(index, 'videoStoragePath', path, true)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Duration</Label>
                            <Input
                              placeholder="e.g., 15:30"
                              value={lesson.duration}
                              onChange={(e) => updateLessonField(index, 'duration', e.target.value, true)}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer with Action Buttons */}
            <div className="border-t pt-4 mt-4">
              <div className="flex gap-3">
                <Button onClick={handleUpdateCourse} className="flex-1 h-11" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Course'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteCourse}
                  className="h-11 px-6"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <CardHeader>
              <CardTitle className="line-clamp-2">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {course.enrollmentCount || 0} students
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleEditClick(course)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Course
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">You haven't created any courses yet.</p>
        </div>
      )}
    </div>
  );
}