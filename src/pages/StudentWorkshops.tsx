import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Users, Video, BookOpen, Award } from 'lucide-react';
import { format } from 'date-fns';
import { getWorkshops, enrollInWorkshop, getEnrolledWorkshops, Workshop } from '@/lib/workshopManager';
import { getStudentCertificates, Certificate } from '@/lib/certificateManager';
import { CertificateComponent } from '@/components/Certificate';

export default function StudentWorkshops() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'certificates'>('all');
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    loadWorkshops();
    if (user) {
      loadCertificates();
    }
  }, [user]);

  const loadWorkshops = async () => {
    const allWorkshops = await getWorkshops();
    setWorkshops(allWorkshops);
  };

  const loadCertificates = async () => {
    if (user) {
      const certs = await getStudentCertificates(user.id);
      setCertificates(certs);
    }
  };

  const filteredWorkshops = workshops.filter(workshop => {
    if (filter === 'enrolled' && user) {
      return workshop.enrolledStudents.includes(user.id);
    }
    if (filter === 'certificates') {
      return false; // Certificates shown separately
    }
    return true;
  });

  const handleEnroll = async (workshopId: string) => {
    if (!user) return;

    const success = await enrollInWorkshop(workshopId, user.id);
    if (success) {
      await loadWorkshops();
      toast.success('Successfully enrolled in workshop!');
    } else {
      toast.error('Could not enroll. Workshop may be full or you are already enrolled.');
    }
  };

  const isEnrolled = (workshopId: string) => {
    if (!user) return false;
    return workshops.find(w => w.id === workshopId)?.enrolledStudents.includes(user.id) || false;
  };

  const handleJoinLive = (workshop: Workshop, sessionId: string) => {
    navigate(`/workshop/${workshop.id}?session=${sessionId}`);
  };

  const renderWorkshopCard = (workshop: Workshop) => {
    const enrolled = isEnrolled(workshop.id);
    const isFull = workshop.enrolledStudents.length >= workshop.maxStudents;
    const liveSession = workshop.sessions.find(s => s.isLive);
    const nextSession = workshop.sessions[0];

    return (
      <Card key={workshop.id} className="group hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge>{workshop.category}</Badge>
            {enrolled && <Badge variant="secondary">Enrolled</Badge>}
          </div>
          <CardTitle className="line-clamp-2">{workshop.title}</CardTitle>
          <CardDescription className="line-clamp-2">{workshop.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>by {workshop.instructorName}</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {workshop.enrolledStudents.length}/{workshop.maxStudents}
              </div>
            </div>

            {liveSession && enrolled && (
              <Button
                className="w-full gap-2 animate-pulse"
                variant="destructive"
                onClick={() => handleJoinLive(workshop, liveSession.id)}
              >
                <Video className="h-4 w-4" />
                JOIN LIVE NOW
              </Button>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {workshop.sessions.length === 1 ? 'Session:' : `Sessions (${workshop.sessions.length} days):`}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                {nextSession && format(new Date(nextSession.date), 'MMM dd, yyyy')}
                {workshop.sessions.length > 1 && ' +'}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {nextSession && `${nextSession.startTime} - ${nextSession.endTime}`}
              </div>
            </div>

            {!enrolled && (
              <Button
                className="w-full"
                onClick={() => handleEnroll(workshop.id)}
                disabled={isFull}
              >
                {isFull ? 'Workshop Full' : 'Enroll Now'}
              </Button>
            )}

            {enrolled && !liveSession && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/workshop/${workshop.id}`)}
              >
                View Details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Workshops</h1>
          <p className="text-muted-foreground">Join live workshop sessions with expert instructors</p>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setFilter(v as 'all' | 'enrolled' | 'certificates')}>
          <TabsList>
            <TabsTrigger value="all">All Workshops</TabsTrigger>
            <TabsTrigger value="enrolled">My Workshops</TabsTrigger>
            <TabsTrigger value="certificates">My Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredWorkshops.map((workshop) => renderWorkshopCard(workshop))}
            </div>
            {filteredWorkshops.length === 0 && (
              <div className="text-center py-12">
                <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No workshops available</h3>
                <p className="text-muted-foreground">Check back soon for new workshops!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="enrolled" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredWorkshops.map((workshop) => renderWorkshopCard(workshop))}
            </div>
            {filteredWorkshops.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No enrolled workshops</h3>
                <p className="text-muted-foreground">Browse all workshops to find one that interests you</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates" className="mt-6 space-y-12">
            {certificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
                <p className="text-muted-foreground">Complete workshops to earn certificates</p>
              </div>
            ) : (
              certificates.map((cert) => (
                <CertificateComponent key={cert.id} certificate={cert} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
