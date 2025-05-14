import { Sidebar } from '@/components/common/sidebar';
import { VideoAnalysis } from '@/components/training/video-analysis';

export default function VideoAnalysisPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Running Form Analysis</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          <VideoAnalysis />
        </div>
      </div>
    </div>
  );
}