import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Course, getCourses, getCourseEnrollmentCount } from '@/lib/courseManager';
import { getCourseLessons } from '@/lib/lessonManager';
import { Search, Users as UsersIcon, Clock } from 'lucide-react';
import { getAvatarColor } from '@/lib/avatarColors';
import { Badge } from '@/components/ui/badge';

interface CourseWithStats extends Course {
  enrollmentCount: number;
  lessonCount: number;
  totalDuration: number;
}

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const allCourses = await getCourses();
    
    // Load stats for each course
    const coursesWithStats = await Promise.all(
      allCourses.map(async (course) => {
        const enrollmentCount = await getCourseEnrollmentCount(course.id);
        const lessons = await getCourseLessons(course.id);
        const totalDuration = lessons.reduce((acc, lesson) => {
          const mins = parseInt(lesson.duration);
          return acc + (isNaN(mins) ? 0 : mins);
        }, 0);

        return {
          ...course,
          enrollmentCount,
          lessonCount: lessons.length,
          totalDuration,
        };
      })
    );

    setCourses(coursesWithStats);
    setLoading(false);
  };

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-display font-bold mb-4 text-gradient">Department Course Catalog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Browse courses and workshops available in your department</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-12 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base border-2 focus:border-primary"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[220px] h-12 text-base border-2">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-fade-in">
          {filteredCourses.map((course) => {
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
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground shadow-lg border-0 hover:bg-primary">
                      <Clock className="h-3 w-3 mr-1" />
                      {course.lessonCount} lessons
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-md" style={{ backgroundColor: avatarColor }}>
                    <AvatarFallback className="text-black dark:text-white font-semibold">
                      {course.instructorName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardDescription className="text-sm font-medium truncate">{course.instructorName}</CardDescription>
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
                      {course.enrollmentCount} students
                    </span>
                    {course.totalDuration > 0 && (
                      <span className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4" />
                        {course.totalDuration} mins
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

        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground text-lg">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
