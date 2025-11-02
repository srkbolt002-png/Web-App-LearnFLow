import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockCourses, mockUsers, Course } from '@/lib/mockData';
import { Users as UsersIcon, Clock, BookOpen } from 'lucide-react';
import { getAvatarColor } from '@/lib/avatarColors';
import { Badge } from '@/components/ui/badge';
import { initializeCourseProgress, getCourseProgress } from '@/lib/progressManager';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('courses');
    if (saved) {
      setCourses(JSON.parse(saved));
    } else {
      localStorage.setItem('courses', JSON.stringify(mockCourses));
      setCourses(mockCourses);
    }
  }, []);

  useEffect(() => {
    if (user && courses.length > 0) {
      const enrolled = courses.filter(course => 
        course.enrolledStudents.includes(user.id)
      );
      setEnrolledCourses(enrolled);
      
      // Initialize progress tracking for enrolled courses
      enrolled.forEach(course => {
        const existingProgress = getCourseProgress(user.id, course.id);
        if (!existingProgress) {
          const lessonIds = course.lessons.map(l => l.id);
          initializeCourseProgress(user.id, course.id, lessonIds);
        }
      });
    }
  }, [user, courses]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-display font-bold mb-4 text-gradient">My Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">Welcome back, {user?.name}! Continue your learning journey.</p>
        </div>

        {/* Enrolled Courses Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">My Enrolled Courses</h2>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Course' : 'Courses'}
            </Badge>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-fade-in">
              {enrolledCourses.map((course) => {
                const instructor = mockUsers.find(u => u.id === course.instructorId);
                const avatarColor = instructor ? getAvatarColor(instructor.name) : '';
                const totalDuration = course.lessons.reduce((acc, lesson) => {
                  const mins = parseInt(lesson.duration);
                  return acc + (isNaN(mins) ? 0 : mins);
                }, 0);
                
                return (
                  <Card 
                    key={course.id} 
                    className="group cursor-pointer border-0 card-glass hover-lift overflow-hidden"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-52 object-cover smooth-transition group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-background/95 backdrop-blur-md shadow-lg border-0">
                          <Clock className="h-3 w-3 mr-1" />
                          {course.lessons.length} lessons
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="space-y-4 pb-4">
                      <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-md" style={{ backgroundColor: avatarColor }}>
                        <AvatarFallback className="text-black dark:text-white font-semibold">
                          {instructor?.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardDescription className="text-sm font-medium truncate">{instructor?.name}</CardDescription>
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary smooth-transition text-xl leading-snug">
                        {course.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-2 font-medium">
                          <UsersIcon className="h-4 w-4" />
                          {course.enrolledStudents.length} students
                        </span>
                        {totalDuration > 0 && (
                          <span className="flex items-center gap-2 font-medium">
                            <Clock className="h-4 w-4" />
                            {totalDuration} mins
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-medium border-primary/30">
                          {course.category}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs capitalize font-medium ${
                            course.difficulty === 'beginner' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                            course.difficulty === 'intermediate' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                            'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          } border`}
                        >
                          {course.difficulty}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 card-glass">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No Enrolled Courses Yet</h3>
                <p className="text-muted-foreground text-lg mb-6 text-center max-w-md">
                  Start your learning journey by enrolling in courses from our catalog.
                </p>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-base px-6 py-2"
                  onClick={() => navigate('/courses')}
                >
                  Browse All Courses
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* All Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">All Available Courses</h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {courses.length} Total
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-fade-in">
            {courses.map((course) => {
              const instructor = mockUsers.find(u => u.id === course.instructorId);
              const avatarColor = instructor ? getAvatarColor(instructor.name) : '';
              const totalDuration = course.lessons.reduce((acc, lesson) => {
                const mins = parseInt(lesson.duration);
                return acc + (isNaN(mins) ? 0 : mins);
              }, 0);
              const isEnrolled = user && course.enrolledStudents.includes(user.id);
              
              return (
                <Card 
                  key={course.id} 
                  className="group cursor-pointer border-0 card-glass hover-lift overflow-hidden"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-52 object-cover smooth-transition group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      {isEnrolled && (
                        <Badge className="bg-primary text-primary-foreground shadow-lg border-0">
                          Enrolled
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-background/95 backdrop-blur-md shadow-lg border-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {course.lessons.length} lessons
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-md" style={{ backgroundColor: avatarColor }}>
                        <AvatarFallback className="text-black dark:text-white font-semibold">
                          {instructor?.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardDescription className="text-sm font-medium truncate">{instructor?.name}</CardDescription>
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2 group-hover:text-primary smooth-transition text-xl leading-snug">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-2 font-medium">
                        <UsersIcon className="h-4 w-4" />
                        {course.enrolledStudents.length} students
                      </span>
                      {totalDuration > 0 && (
                        <span className="flex items-center gap-2 font-medium">
                          <Clock className="h-4 w-4" />
                          {totalDuration} mins
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-medium border-primary/30">
                        {course.category}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs capitalize font-medium ${
                          course.difficulty === 'beginner' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                          course.difficulty === 'intermediate' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                          'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        } border`}
                      >
                        {course.difficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
