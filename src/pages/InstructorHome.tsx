import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, BookOpen, PlusCircle, Upload, CheckCircle, Users } from 'lucide-react';

export default function InstructorHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tips = [
    {
      icon: <PlusCircle className="w-8 h-8 text-primary" />,
      title: "Creating Your First Course",
      description: "Click on 'Dashboard' in the navigation menu, then use the 'Create New Course' button. Fill in all required course details.",
      steps: [
        "Navigate to Instructor Dashboard",
        "Click 'Create New Course' button",
        "Enter course title and description",
        "Set category and difficulty level",
        "Specify course duration (e.g., '4 weeks', '2 months')",
        "Add course thumbnail URL"
      ]
    },
    {
      icon: <Video className="w-8 h-8 text-primary" />,
      title: "Linking Vimeo Videos",
      description: "You can easily embed Vimeo videos in your lessons. Here's how to get the correct link:",
      steps: [
        "Upload your video to Vimeo",
        "Click on the video to open it",
        "Click the 'Share' button",
        "Copy the video URL (e.g., https://vimeo.com/123456789)",
        "Paste this URL in the 'Video URL' field when adding a lesson",
        "The video will automatically embed in your course"
      ]
    },
    {
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      title: "Adding Lessons to Courses",
      description: "Lessons are the building blocks of your course. Add multiple lessons to create comprehensive learning experiences.",
      steps: [
        "When creating/editing a course, scroll to 'Lessons' section",
        "Click 'Add Lesson' button",
        "Enter lesson title (e.g., 'Introduction to React Hooks')",
        "Add lesson duration (e.g., '15 minutes')",
        "Paste Vimeo video URL in the Video URL field",
        "Click 'Add Lesson' again to add more lessons",
        "Use the trash icon to remove unwanted lessons"
      ]
    },
    {
      icon: <Upload className="w-8 h-8 text-primary" />,
      title: "Course Thumbnails",
      description: "Make your course stand out with attractive thumbnails:",
      steps: [
        "Use high-quality images (recommended: 1280x720px)",
        "Upload images to a service like Imgur or use Unsplash",
        "Copy the direct image URL",
        "Paste it in the 'Thumbnail URL' field",
        "Preview your course card to see how it looks"
      ]
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-primary" />,
      title: "Best Practices",
      description: "Tips to create engaging and successful courses:",
      steps: [
        "Start with a clear course outline",
        "Keep lessons between 5-20 minutes for better engagement",
        "Use descriptive lesson titles",
        "Organize lessons in logical order",
        "Add comprehensive course descriptions",
        "Set appropriate difficulty levels",
        "Include estimated duration for better planning"
      ]
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Managing Your Courses",
      description: "Edit and maintain your courses easily:",
      steps: [
        "Go to Instructor Dashboard to see all your courses",
        "Click 'Edit' on any course to modify it",
        "Update lessons, duration, or descriptions anytime",
        "Delete courses you no longer want to offer",
        "Monitor student enrollments and progress"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}! 👋</h1>
          <p className="text-muted-foreground text-lg">
            Here's everything you need to know to create amazing courses on our platform.
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Start Guide</CardTitle>
              <CardDescription>
                Follow these tips to create and manage your courses effectively
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {tips.map((tip, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {tip.icon}
                  <CardTitle className="text-xl">{tip.title}</CardTitle>
                </div>
                <CardDescription>{tip.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {tip.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-muted-foreground leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/instructor')} size="lg">
            Go to Dashboard
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" size="lg">
            Browse Courses
          </Button>
        </div>
      </div>
    </div>
  );
}
