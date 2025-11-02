import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getUserProgress, formatTimeSpent, CourseProgress, getAchievementDetails } from '@/lib/progressManager';
import { Course } from '@/lib/mockData';
import { BookOpen, Clock, CheckCircle2, TrendingUp, Award, Flame, Target, PlayCircle } from 'lucide-react';

export default function StudentProgress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'student') {
        navigate('/');
        return;
      }

      const userProgress = await getUserProgress(user.id);
      setProgress(userProgress);

      const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      setCourses(allCourses);
    };

    loadData();
  }, [user, navigate]);

  const getCourseDetails = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const totalTimeSpent = progress.reduce((acc, p) => acc + p.totalTimeSpent, 0);
  const totalLessonsCompleted = progress.reduce(
    (acc, p) => acc + p.lessons.filter(l => l.completed).length,
    0
  );
  const totalLessons = progress.reduce((acc, p) => acc + p.lessons.length, 0);
  const averageCompletion = progress.length > 0
    ? Math.round(progress.reduce((acc, p) => acc + p.completionPercentage, 0) / progress.length)
    : 0;

  const inProgressCourses = progress.filter(p => p.completionPercentage > 0 && p.completionPercentage < 100);
  const completedCourses = progress.filter(p => p.completionPercentage === 100);
  const notStartedCourses = progress.filter(p => p.completionPercentage === 0);

  const renderCourseCard = (courseProgress: CourseProgress) => {
    const course = getCourseDetails(courseProgress.courseId);
    if (!course) return null;

    const completedLessons = courseProgress.lessons.filter(l => l.completed).length;
    const totalVideoTime = courseProgress.lessons.reduce((acc, l) => acc + l.videoWatchTime, 0);

    return (
      <Card key={courseProgress.courseId} className="hover:shadow-lg transition-all">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <CardDescription>{course.category}</CardDescription>
            </div>
            <Badge variant={courseProgress.completionPercentage === 100 ? "default" : "secondary"}>
              {courseProgress.completionPercentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedLessons}/{courseProgress.lessons.length} lessons completed</span>
              <span>{courseProgress.completionPercentage}%</span>
            </div>
            <Progress value={courseProgress.completionPercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Total Time</span>
              </div>
              <p className="text-sm font-medium">{formatTimeSpent(courseProgress.totalTimeSpent)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <PlayCircle className="h-4 w-4" />
                <span className="text-xs">Video Time</span>
              </div>
              <p className="text-sm font-medium">{formatTimeSpent(totalVideoTime)}</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="lessons" className="border-none">
              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                View Lesson Details
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {course.lessons.map((lesson, idx) => {
                    const lessonProg = courseProgress.lessons.find(l => l.lessonId === lesson.id);
                    return (
                      <div key={lesson.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                        <div className="flex items-center gap-2 flex-1">
                          {lessonProg?.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                          )}
                          <span className="text-sm">{lesson.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeSpent(lessonProg?.timeSpent || 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button 
            onClick={() => navigate(`/course/${course.id}`)}
            className="w-full"
            variant={courseProgress.completionPercentage === 100 ? "outline" : "default"}
          >
            {courseProgress.completionPercentage === 100 ? 'Review Course' : 'Continue Learning'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Progress</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress[0]?.currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground">Days in a row</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTimeSpent(totalTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">Learning time</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessonsCompleted}</div>
            <p className="text-xs text-muted-foreground">Out of {totalLessons} total</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.length}</div>
            <p className="text-xs text-muted-foreground">{completedCourses.length} completed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletion}%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      {progress.some(p => p.achievements && p.achievements.length > 0) && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Achievements</CardTitle>
            </div>
            <CardDescription>Your learning milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {progress.flatMap(p => p.achievements || [])
                .filter((value, index, self) => self.indexOf(value) === index)
                .map(achievementId => {
                  const achievement = getAchievementDetails(achievementId);
                  return (
                    <div key={achievementId} className="text-center p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Progress Tabs */}
      <Tabs defaultValue="in-progress" className="space-y-6">
        <TabsList>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressCourses.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="not-started">
            Not Started ({notStartedCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No courses in progress</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressCourses.map(renderCourseCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No completed courses yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedCourses.map(renderCourseCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="not-started" className="space-y-4">
          {notStartedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>You've started all your enrolled courses!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notStartedCourses.map(renderCourseCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
