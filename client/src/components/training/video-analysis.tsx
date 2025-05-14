import { useState } from 'react';
import { SubscriptionGate } from '@/components/common/subscription-gate';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Trash2, Video } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function VideoAnalysis() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create video preview URL
      const preview = URL.createObjectURL(selectedFile);
      setVideoPreview(preview);
      
      // Reset analysis
      setAnalysisResult(null);
    }
  };
  
  // Handle video recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const recorder = new MediaRecorder(stream);
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordedChunks([]);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          setRecordedChunks([...chunks]);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoURL = URL.createObjectURL(blob);
        setVideoPreview(videoURL);
        
        // Convert to file for upload
        const videoFile = new File([blob], "running-form.webm", { type: 'video/webm' });
        setFile(videoFile);
        
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Reset analysis
        setAnalysisResult(null);
      };
      
      recorder.start();
      
      // Stop recording after 30 seconds max
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
        }
      }, 30000);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera Access Error',
        description: 'Could not access your camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  
  // Clear selected video
  const clearVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setFile(null);
    setVideoPreview(null);
    setAnalysisResult(null);
    setRecordedChunks([]);
  };
  
  // Upload and analyze video
  const analyzeVideoMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No video file selected');
      
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await apiRequest('POST', '/api/video-analysis', formData, {
        isFormData: true,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: 'Your running form analysis is ready!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  return (
    <SubscriptionGate
      requiredSubscription="annual"
      featureName="Running Form Video Analysis"
      icon={Video}
      description="Get AI-powered analysis of your running form to improve efficiency and prevent injuries. Exclusive for annual subscribers."
    >
      <Card>
        <CardHeader>
          <CardTitle>Running Form Analysis</CardTitle>
          <CardDescription>
            Upload or record a video of your running form to receive AI-powered analysis and improvement suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload">
            <TabsList className="mb-4">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </TabsTrigger>
              <TabsTrigger value="record">
                <Camera className="mr-2 h-4 w-4" />
                Record Video
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <div className="flex flex-col items-center">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Video should be 10-30 seconds of you running from the side or front view.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="record">
              <div className="flex flex-col items-center">
                {isRecording ? (
                  <div className="text-center mb-4">
                    <div className="inline-block px-4 py-2 rounded-full bg-red-100 text-red-700 mb-2">
                      Recording... 
                    </div>
                    <Button 
                      onClick={stopRecording} 
                      variant="destructive"
                    >
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={startRecording}
                      className="mb-4"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                    <p className="text-sm text-muted-foreground mb-4">
                      Position your device to capture your running form from the side or front.
                    </p>
                  </>
                )}
              </div>
            </TabsContent>
            
            {videoPreview && (
              <div className="mt-4">
                <div className="relative">
                  <video 
                    src={videoPreview} 
                    controls 
                    className="w-full h-auto max-h-[300px] rounded-md mb-2"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearVideo}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {analysisResult && (
              <Card className="mt-4 bg-muted">
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => analyzeVideoMutation.mutate()}
            disabled={!file || analyzeVideoMutation.isPending}
            className="w-full"
          >
            {analyzeVideoMutation.isPending ? 'Analyzing...' : 'Analyze My Running Form'}
          </Button>
        </CardFooter>
      </Card>
    </SubscriptionGate>
  );
}