export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  bio?: string;
  isApproved?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructorId: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
  enrolledStudents: string[];
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  vimeoUrl: string;
  duration: string;
}

export interface Comment {
  id: string;
  courseId: string;
  lessonId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface InstructorApplication {
  id: string;
  userId: string;
  reason: string;
  experience: string;
  expertise: string;
  qualifications: string;
  courseIdea: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@learnflow.com',
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
  {
    id: '2',
    email: 'john@instructor.com',
    name: 'John Doe',
    role: 'instructor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    bio: 'Passionate educator with 10+ years of experience',
    isApproved: true,
  },
  {
    id: '3',
    email: 'student@example.com',
    name: 'Jane Smith',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
  },
];

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of HTML, CSS, and JavaScript in this comprehensive beginner course.',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    instructorId: '2',
    category: 'Web Development',
    difficulty: 'beginner',
    enrolledStudents: ['3'],
    createdAt: '2024-01-15',
    lessons: [
      {
        id: '1-1',
        title: 'Getting Started with HTML',
        description: 'Learn the basics of HTML structure and semantic markup',
        vimeoUrl: 'https://vimeo.com/148751763',
        duration: '15:30',
      },
      {
        id: '1-2',
        title: 'CSS Fundamentals',
        description: 'Master styling with CSS',
        vimeoUrl: 'https://vimeo.com/148751763',
        duration: '20:45',
      },
    ],
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    description: 'Deep dive into advanced React concepts, hooks, and performance optimization.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    instructorId: '2',
    category: 'Frontend Development',
    difficulty: 'advanced',
    enrolledStudents: [],
    createdAt: '2024-02-10',
    lessons: [
      {
        id: '2-1',
        title: 'Custom Hooks Deep Dive',
        description: 'Learn to create powerful custom hooks',
        vimeoUrl: 'https://vimeo.com/148751763',
        duration: '25:00',
      },
    ],
  },
  {
    id: '3',
    title: 'Python for Data Science',
    description: 'Master Python programming for data analysis and machine learning applications.',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
    instructorId: '2',
    category: 'Data Science',
    difficulty: 'intermediate',
    enrolledStudents: ['3'],
    createdAt: '2024-01-20',
    lessons: [
      {
        id: '3-1',
        title: 'Python Basics',
        description: 'Introduction to Python syntax and data structures',
        vimeoUrl: 'https://vimeo.com/148751763',
        duration: '18:30',
      },
    ],
  },
];