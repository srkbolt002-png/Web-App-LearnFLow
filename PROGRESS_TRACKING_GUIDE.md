# Progress Tracking System Guide

## Overview
This learning platform includes a comprehensive progress tracking system similar to Vimeo's video progress tracking, with additional features for educational content.

## Features

### 1. **Accurate Time Tracking**
- **Session Time**: Automatically tracks time spent on each lesson (updates every 30 seconds)
- **Video Watch Time**: Tracks actual video viewing time separately
- **Lesson Time**: Individual time tracking for each lesson
- **Course Total Time**: Aggregated time across all lessons in a course

### 2. **Progress Visualization**
- **Completion Percentage**: Real-time calculation based on completed lessons
- **Progress Bars**: Visual representation of course completion
- **Lesson-by-Lesson Details**: Expandable view showing progress for each lesson
- **Video Time vs Total Time**: Separate tracking for video content and overall learning time

### 3. **Achievements System**
Students earn achievements for:
- 🎯 **First Steps**: Completing first lesson
- 📚 **Knowledge Seeker**: Completing 5 lessons
- 🏆 **Course Master**: Completing entire course
- 🔥 **Consistent Learner**: 7-day learning streak
- ⏰ **Time Invested**: 5 hours of learning

### 4. **Learning Streaks**
- Tracks consecutive days of learning
- Automatically updates when student accesses lessons
- Resets if no activity for more than 1 day
- Displayed prominently on progress dashboard

## How It Works

### Time Tracking Methods

#### A. Automatic Session Tracking (Current Implementation)
When a student views a lesson, the system:
1. Records the session start time
2. Updates progress every 30 seconds
3. Saves remaining time when leaving the page
4. Tracks time per lesson and aggregates for total course time

```typescript
// Implemented in CourseDetail.tsx
// Automatically tracks time while student is on lesson page
```

#### B. Video-Specific Tracking (For Custom Players)
For custom video players with playback controls:

```typescript
import { useVideoTracking } from '@/hooks/use-video-tracking';

// In your video player component
const { totalWatchedTime } = useVideoTracking({
  userId: user.id,
  courseId: course.id,
  lessonId: currentLesson.id,
  isPlaying: videoIsPlaying,      // Boolean: is video currently playing
  currentTime: videoCurrentTime,   // Number: current playback position in seconds
  enabled: isEnrolled             // Boolean: only track for enrolled students
});
```

**Key Features:**
- Only counts time when video is actually playing
- Prevents counting when seeking forward (detects jumps > 2 seconds)
- Updates database every 10 seconds of watched content
- Saves position for "resume where you left off" feature

### Data Structure

```typescript
interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent: number;          // Total time on lesson (seconds)
  videoWatchTime: number;     // Actual video watched (seconds)
  lastWatchPosition: number;  // Resume position (seconds)
  watchCount: number;         // Times lesson was accessed
}

interface CourseProgress {
  courseId: string;
  userId: string;
  enrolledAt: string;
  lastAccessedAt: string;
  totalTimeSpent: number;
  lessons: LessonProgress[];
  completionPercentage: number;
  currentStreak: number;
  lastActivityDate: string;
  achievements: string[];
}
```

## API Reference

### Core Functions

#### `initializeCourseProgress(userId, courseId, lessonIds)`
Creates initial progress tracking for a newly enrolled student.

#### `updateLessonProgress(userId, courseId, lessonId, completed, additionalTime)`
Updates lesson completion status and adds learning time.

#### `updateVideoProgress(userId, courseId, lessonId, watchTime, currentPosition)`
Specifically tracks video watch time and current playback position.

#### `getCourseProgress(userId, courseId)`
Retrieves progress data for a specific course.

#### `getUserProgress(userId)`
Gets all progress data for a user across all courses.

#### `formatTimeSpent(seconds)`
Formats seconds into human-readable format (e.g., "2h 34m" or "45m").

#### `getAchievementDetails(achievementId)`
Returns title, description, and icon for an achievement.

## Student Progress Dashboard

The progress dashboard (`/student/progress`) displays:

1. **Statistics Cards**
   - Learning Streak 🔥
   - Total Time ⏰
   - Completed Lessons ✓
   - Courses Enrolled 📚
   - Average Completion 📈

2. **Achievements Gallery**
   - Visual display of earned achievements
   - Icons and descriptions for each milestone

3. **Course Cards with Details**
   - Overall completion percentage
   - Progress bar
   - Total time and video time
   - Expandable lesson-by-lesson breakdown
   - Continue/Review buttons

4. **Tabs Organization**
   - In Progress: Active learning courses
   - Completed: Fully finished courses
   - Not Started: Enrolled but not begun

## Notifications

The system sends notifications for:
- Course enrollment confirmation
- Instructor adds new lesson to enrolled course
- Instructor updates course content
- Achievement unlocked (can be enabled)

## Integration Tips

### For Vimeo Videos
Current implementation uses iframe embedding. To enable full tracking:
1. Use Vimeo Player API
2. Listen to `timeupdate`, `play`, `pause` events
3. Pass data to `useVideoTracking` hook

### For YouTube Videos
```typescript
// Use YouTube IFrame API
const onPlayerStateChange = (event) => {
  const isPlaying = event.data === YT.PlayerState.PLAYING;
  const currentTime = event.target.getCurrentTime();
  // Update your tracking state
};
```

### For Custom HTML5 Video
```typescript
<video
  ref={videoRef}
  onTimeUpdate={() => setCurrentTime(videoRef.current.currentTime)}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
/>
```

## Best Practices

1. **Only track enrolled students**: Check `isEnrolled` before tracking
2. **Update regularly but not too frequently**: Current: 30s for sessions, 10s for videos
3. **Save on unmount**: Always save remaining time when component unmounts
4. **Validate time differences**: Prevent counting when user seeks forward in video
5. **User privacy**: All data stored locally in localStorage (can be migrated to database)

## Future Enhancements

Potential improvements:
- Weekly/monthly progress reports
- Comparison with peer averages
- Estimated time to completion
- Certificate generation on course completion
- Leaderboards for competitive learning
- Export progress data
- Shareable achievement badges
- Mobile app integration for offline tracking

## Storage

Currently uses **localStorage** for simplicity. For production:
- Migrate to database (Lovable Cloud/Supabase)
- Add user authentication validation
- Implement data sync across devices
- Add backup and export features

## Testing

To test the progress tracking:
1. Enroll in a course as a student
2. View lessons for different durations
3. Complete lessons using checkmarks
4. Check `/student/progress` for updated stats
5. Return on consecutive days to build streak
6. Verify achievements appear after milestones
