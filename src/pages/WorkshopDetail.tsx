import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getWorkshopById, Workshop } from '@/lib/workshopManager';
import { getWorkshopComments, createComment, Comment } from '@/lib/commentManager';
import { getWorkshopCertificate, Certificate } from '@/lib/certificateManager';
import { CertificateComponent } from '@/components/Certificate';
import { Calendar as CalendarIcon, Clock, Users, Video, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function WorkshopDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const { user } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    if (id) {
      loadWorkshop();
      loadComments();
      if (user) {
        loadCertificate();
      }
    }
  }, [id, user]);

  const loadWorkshop = async () => {
    if (id) {
      const ws = await getWorkshopById(id);
      setWorkshop(ws || null);
    }
  };

  const loadComments = async () => {
    if (id) {
      const workshopComments = await getWorkshopComments(id);
      setComments(workshopComments);
    }
  };

  const loadCertificate = async () => {
    if (id && user) {
      const cert = await getWorkshopCertificate(id, user.id);
      setCertificate(cert || null);
    }
  };

  const handlePostComment = async () => {
    if (!user || !workshop || !newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    await createComment(workshop.id, user.id, user.name, newComment.trim());
    setNewComment('');
    await loadComments();
    toast.success('Comment posted!');
  };


  if (!workshop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Workshop not found</p>
      </div>
    );
  }

  const currentSession = sessionId 
    ? workshop.sessions.find(s => s.id === sessionId)
    : workshop.sessions.find(s => s.isLive);

  const isEnrolled = user && workshop.enrolledStudents.includes(user.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Workshop Header */}
          <div>
            <Badge className="mb-4">{workshop.category}</Badge>
            <h1 className="text-4xl font-bold mb-2">{workshop.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{workshop.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Instructor: {workshop.instructorName}</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {workshop.enrolledStudents.length}/{workshop.maxStudents} enrolled
              </div>
            </div>
          </div>

          {/* Live Video Player */}
          {currentSession?.isLive && currentSession.vimeoLiveUrl && isEnrolled && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                  <span className="text-sm font-medium">
                    {format(new Date(currentSession.date), 'MMMM dd, yyyy')} • {currentSession.startTime} - {currentSession.endTime}
                  </span>
                </div>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={currentSession.vimeoLiveUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Live Workshop"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not Enrolled Message */}
          {currentSession?.isLive && !isEnrolled && (
            <Card className="border-primary">
              <CardContent className="p-6 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">This workshop is live now!</h3>
                <p className="text-muted-foreground">
                  Enroll in this workshop to join live sessions
                </p>
              </CardContent>
            </Card>
          )}

          {/* Session Schedule */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Session Schedule</h2>
              <div className="space-y-3">
                {workshop.sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border ${
                      session.isLive ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(session.date), 'EEEE, MMMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{session.startTime} - {session.endTime}</span>
                        </div>
                      </div>
                      {session.isLive && (
                        <Badge variant="destructive">LIVE NOW</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certificate Section */}
          {certificate && (
            <div className="my-8">
              <CertificateComponent certificate={certificate} />
            </div>
          )}

          {/* About Workshop */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">About This Workshop</h2>
              <p className="text-muted-foreground leading-relaxed">
                {workshop.description}
              </p>
            </CardContent>
          </Card>

          {/* Comments Section */}
          {isEnrolled && (
            <Card>
              <CardHeader>
                <CardTitle>Discussion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Share your thoughts or ask questions..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handlePostComment} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm">{comment.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
