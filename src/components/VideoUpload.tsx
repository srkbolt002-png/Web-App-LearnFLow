import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
  lessonId: string;
  onUploadComplete: (storagePath: string) => void;
  existingPath?: string;
}

export function VideoUpload({ lessonId, onUploadComplete, existingPath }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedPath, setUploadedPath] = useState(existingPath || '');
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (30MB)
    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is 30MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload MP4, MOV, WebM, or AVI files only.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${lessonId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const { error: uploadError } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, file);

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      setUploadedPath(filePath);
      onUploadComplete(filePath);

      toast({
        title: "Upload successful",
        description: `Video uploaded (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = "There was an error uploading your video. Please try again.";
      
      // Provide specific error messages for common issues
      if (error?.message?.includes('bucket')) {
        errorMessage = "Storage bucket not configured. Please contact administrator.";
      } else if (error?.message?.includes('permission') || error?.message?.includes('policy')) {
        errorMessage = "Permission denied. Please check storage settings.";
      } else if (error?.message?.includes('size')) {
        errorMessage = "File too large. Maximum size is 30MB.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedPath) return;

    try {
      const { error } = await supabase.storage
        .from('lesson-videos')
        .remove([uploadedPath]);

      if (error) throw error;

      setUploadedPath('');
      onUploadComplete('');

      toast({
        title: "Video removed",
        description: "The video has been deleted.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the video.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-2">
      {!uploadedPath ? (
        <>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md mb-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Select a video file from your computer to upload
            </p>
          </div>
          <Input
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Max size: 30MB • Formats: MP4, MOV, WebM, AVI
          </p>
        </>
      ) : (
        <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Video uploaded</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
