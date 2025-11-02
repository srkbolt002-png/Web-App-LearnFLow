import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon, Clock, Users, Video, Trash2, Edit, Award } from 'lucide-react';
import { format } from 'date-fns';
import { createWorkshop, getInstructorWorkshops, deleteWorkshop, updateSessionLiveStatus, updateWorkshop, Workshop, WorkshopSession } from '@/lib/workshopManager';
import { notifyEnrolledWorkshopStudents } from '@/lib/notificationManager';
import { issueCertificates } from '@/lib/certificateManager';
import { cn } from '@/lib/utils';

export default function InstructorWorkshops() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    maxStudents: 30,
  });
  const [sessions, setSessions] = useState<Array<{ date: Date | undefined; startTime: string; endTime: string }>>([
    { date: undefined, startTime: '', endTime: '' }
  ]);

  useEffect(() => {
    if (user) {
      loadWorkshops();
    }
  }, [user]);

  const loadWorkshops = async () => {
    if (user) {
      const instructorWorkshops = await getInstructorWorkshops(user.id);
      setWorkshops(instructorWorkshops);
    }
  };

  const handleCreateWorkshop = async () => {
    if (!user || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user.departmentId) {
      toast.error('You must be assigned to a department to create workshops');
      return;
    }

    const validSessions = sessions.filter(s => s.date && s.startTime && s.endTime);
    if (validSessions.length === 0) {
      toast.error('Please add at least one session with date and time');
      return;
    }

    const workshopSessions: WorkshopSession[] = validSessions.map(s => ({
      id: `session-${Date.now()}-${Math.random()}`,
      date: format(s.date!, 'yyyy-MM-dd'),
      startTime: s.startTime,
      endTime: s.endTime,
      isLive: false,
    }));

    try {
      const workshop = await createWorkshop({
        ...formData,
        instructorId: user.id,
        instructorName: user.name,
        departmentId: user.departmentId, // Add departmentId from user profile
        sessions: workshopSessions,
        maxStudents: formData.maxStudents,
        status: 'upcoming',
      });

      if (workshop) {
        toast.success('Workshop created successfully');
        await loadWorkshops();
        setIsCreateOpen(false);
        resetForm();
      } else {
        toast.error('Failed to create workshop');
      }
    } catch (error) {
      console.error('Error creating workshop:', error);
      toast.error('An error occurred while creating the workshop');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      maxStudents: 30,
    });
    setSessions([{ date: undefined, startTime: '', endTime: '' }]);
  };

  const addSession = () => {
    setSessions([...sessions, { date: undefined, startTime: '', endTime: '' }]);
  };

  const updateSession = (index: number, field: string, value: any) => {
    const updated = [...sessions];
    updated[index] = { ...updated[index], [field]: value };
    setSessions(updated);
  };

  const removeSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const handleDelete = (workshopId: string) => {
    if (confirm('Are you sure you want to delete this workshop?')) {
      deleteWorkshop(workshopId);
      loadWorkshops();
      toast.success('Workshop deleted');
    }
  };

  const handleGoLive = (workshop: Workshop, session: WorkshopSession) => {
    const vimeoUrl = prompt('Enter Vimeo Live Stream URL:');
    if (vimeoUrl) {
      updateSessionLiveStatus(workshop.id, session.id, true, vimeoUrl);
      notifyEnrolledWorkshopStudents(
        workshop.id,
        workshop.title,
        'workshop_live',
        `Workshop session is now LIVE! Join now: ${workshop.title} - ${format(new Date(session.date), 'MMM dd')} at ${session.startTime}`
      );
      loadWorkshops();
      toast.success('Session is now live! Students have been notified.');
    }
  };

  const handleEndLive = (workshop: Workshop, session: WorkshopSession) => {
    updateSessionLiveStatus(workshop.id, session.id, false);
    loadWorkshops();
    toast.success('Session ended');
  };

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      title: workshop.title,
      description: workshop.description,
      category: workshop.category,
      thumbnail: workshop.thumbnail,
      maxStudents: workshop.maxStudents,
    });
    setSessions(workshop.sessions.map(s => ({
      date: new Date(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
    })));
    setIsEditOpen(true);
  };

  const handleUpdateWorkshop = async () => {
    if (!user || !editingWorkshop || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validSessions = sessions.filter(s => s.date && s.startTime && s.endTime);
    if (validSessions.length === 0) {
      toast.error('Please add at least one session with date and time');
      return;
    }

    const workshopSessions: WorkshopSession[] = validSessions.map(s => ({
      id: `session-${Date.now()}-${Math.random()}`,
      date: format(s.date!, 'yyyy-MM-dd'),
      startTime: s.startTime,
      endTime: s.endTime,
      isLive: false,
    }));

    try {
      const success = await updateWorkshop(editingWorkshop.id, {
        ...formData,
        sessions: workshopSessions,
      });

      if (success) {
        await notifyEnrolledWorkshopStudents(
          editingWorkshop.id,
          formData.title,
          'workshop_update',
          `Workshop "${formData.title}" has been updated with new schedule`
        );

        toast.success('Workshop updated successfully');
        await loadWorkshops();
        setIsEditOpen(false);
        setEditingWorkshop(null);
        resetForm();
      } else {
        toast.error('Failed to update workshop');
      }
    } catch (error) {
      console.error('Error updating workshop:', error);
      toast.error('An error occurred while updating the workshop');
    }
  };

  const handleIssueCertificates = async (workshop: Workshop) => {
    if (!user) return;
    if (workshop.enrolledStudents.length === 0) {
      toast.error('No students enrolled in this workshop');
      return;
    }

    const issued = await issueCertificates(
      workshop.id,
      workshop.title,
      user.id,
      user.name,
      workshop.enrolledStudents
    );

    if (issued.length > 0) {
      await notifyEnrolledWorkshopStudents(
        workshop.id,
        workshop.title,
        'certificate_issued',
        `Congratulations! Your certificate for "${workshop.title}" has been issued!`
      );
      toast.success(`Issued ${issued.length} certificate(s)!`);
    } else {
      toast.info('All students already have certificates');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Workshops</h1>
            <p className="text-muted-foreground">Create and manage live workshop sessions</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Workshop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Workshop</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Workshop Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Advanced React Patterns"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what students will learn..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Programming, Design, Business"
                  />
                </div>
                <div>
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Workshop Sessions</Label>
                  {sessions.map((session, index) => (
                    <Card key={index} className="mt-3 p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Session {index + 1}</span>
                          {sessions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSession(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !session.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {session.date ? format(session.date, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={session.date}
                              onSelect={(date) => updateSession(index, 'date', date)}
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={session.startTime}
                              onChange={(e) => updateSession(index, 'startTime', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={session.endTime}
                              onChange={(e) => updateSession(index, 'endTime', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={addSession}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Session
                  </Button>
                </div>
              </div>
              <Button onClick={handleCreateWorkshop} className="w-full">
                Create Workshop
              </Button>
            </DialogContent>
          </Dialog>
          
          {/* Edit Workshop Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Workshop</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-title">Workshop Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-maxStudents">Max Students</Label>
                  <Input
                    id="edit-maxStudents"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Workshop Sessions</Label>
                  {sessions.map((session, index) => (
                    <Card key={index} className="mt-3 p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Session {index + 1}</span>
                          {sessions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSession(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !session.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {session.date ? format(session.date, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={session.date}
                              onSelect={(date) => updateSession(index, 'date', date)}
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={session.startTime}
                              onChange={(e) => updateSession(index, 'startTime', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={session.endTime}
                              onChange={(e) => updateSession(index, 'endTime', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={addSession}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Session
                  </Button>
                </div>
              </div>
              <Button onClick={handleUpdateWorkshop} className="w-full">
                Update Workshop
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop) => (
            <Card key={workshop.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge>{workshop.category}</Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(workshop)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(workshop.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="line-clamp-2">{workshop.title}</CardTitle>
                <CardDescription className="line-clamp-2">{workshop.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {workshop.enrolledStudents.length}/{workshop.maxStudents} enrolled
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sessions:</p>
                    {workshop.sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{format(new Date(session.date), 'MMM dd')}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{session.startTime}-{session.endTime}</span>
                        </div>
                        {session.isLive ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleEndLive(workshop, session)}
                          >
                            End Live
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleGoLive(workshop, session)}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Go Live
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => handleIssueCertificates(workshop)}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Issue Certificates
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {workshops.length === 0 && (
          <div className="text-center py-12">
            <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No workshops yet</h3>
            <p className="text-muted-foreground mb-6">Create your first workshop to get started</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workshop
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
