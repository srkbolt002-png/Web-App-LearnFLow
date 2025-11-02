import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Award, CheckCircle, TrendingUp, Globe, FileText, UserCheck, Rocket, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAvatarColor } from '@/lib/avatarColors';
import { Course, getCourses } from '@/lib/courseManager';
import { getCourseLessons } from '@/lib/lessonManager';

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const allCourses = await getCourses();
    setCourses(allCourses);
    setLoading(false);
  };

  const featuredCourses = courses.slice(0, 3);
  return <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 md:py-36 px-4 overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{
        animationDelay: '2s'
      }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-in fade-in slide-in-from-bottom duration-700">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Launch Your Learning Journey Today</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-in fade-in slide-in-from-bottom duration-700 leading-tight">
            LearnFlow — Your Department's <span className="text-gradient">Learning Hub</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 text-muted-foreground max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-150 leading-relaxed">
            Empowering departments with structured learning paths, comprehensive courses, interactive workshops, and progress tracking.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <Button size="lg" variant="glow" onClick={() => navigate('/courses')} className="group">
              Explore Courses
              <BookOpen className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Login to Your Account
            </Button>
          </div>
          
          {/* Stats */}
          
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-fade-in">
            <Card className="text-center border-0 card-glass hover-lift group">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl educational-gradient text-white mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl mb-3">Departmental Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Courses and workshops organized by department with role-based access for students, instructors, and admins
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 card-glass hover-lift group">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl secondary-gradient text-white mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl mb-3">Workshop Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Interactive workshops with session scheduling, attendance tracking, and hands-on learning experiences
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 card-glass hover-lift group">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent/70 text-white mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl mb-3">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor learning progress with detailed analytics, completion certificates, and performance insights
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      

      {/* How to Become an Instructor */}
      

      {/* For Department Instructors */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">For Department Instructors</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Powerful tools to create and manage learning experiences</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto stagger-fade-in">
            <Card className="hover-lift border-0 card-glass group">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl educational-gradient text-white mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">Course Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Create comprehensive courses with video lessons, structured content, and learning objectives for your department.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 card-glass group">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl secondary-gradient text-white mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">Workshop Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Schedule and conduct interactive workshops with session management, attendance, and hands-on activities.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 card-glass group">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/70 text-white mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">Student Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Track student progress, view completion rates, and monitor learning outcomes within your department.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 card-glass group">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl educational-gradient text-white mb-4 group-hover:scale-110 transition-transform">
                  <Award className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Issue completion certificates to students who successfully finish courses and achieve learning milestones.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 card-glass group">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl secondary-gradient text-white mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">Easy Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Update courses, manage content, and organize learning materials all from your centralized instructor dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Featured Courses</h2>
            <p className="text-lg text-muted-foreground">Discover our most popular learning experiences</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading courses...</p>
            </div>
          ) : featuredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No courses available yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-fade-in">
                {featuredCourses.map((course) => {
                  const avatarColor = getAvatarColor(course.instructorName);
                  
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
                      </div>
                      
                      <CardHeader className="space-y-4 pb-4">
                        <div className="flex items-center gap-3">
                          <Avatar 
                            className="h-10 w-10 border-2 border-background shadow-md" 
                            style={{ backgroundColor: avatarColor }}
                          >
                            <AvatarFallback className="text-white font-semibold">
                              {course.instructorName[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardDescription className="text-sm font-medium truncate">
                              {course.instructorName}
                            </CardDescription>
                          </div>
                        </div>
                        <CardTitle className="line-clamp-2 group-hover:text-primary smooth-transition text-xl leading-snug">
                          {course.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs font-medium border-primary/30">
                            {course.category}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs capitalize font-medium ${
                              course.level === 'beginner' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                              course.level === 'intermediate' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                              'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            } border`}
                          >
                            {course.level}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="text-center mt-12">
                <Button size="lg" variant="secondary" onClick={() => navigate('/courses')} className="group">
                  View All Courses
                  <BookOpen className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Testimonials */}
      
    </div>;
}