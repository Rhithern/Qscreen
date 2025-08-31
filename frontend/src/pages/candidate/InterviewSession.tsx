import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Question {
  id: string;
  question_text: string;
  position: number;
}

interface Job {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export function InterviewSession() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [responses, setResponses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    if (jobId) {
      loadJob();
    }
  }, [user, jobId, navigate]);

  const loadJob = async () => {
    try {
      setLoading(true);
      // For now, create a mock job since we need the backend to be running
      const mockJob: Job = {
        id: jobId!,
        title: 'Frontend Developer Interview',
        description: 'Technical interview for frontend developer position',
        questions: [
          { id: '1', question_text: 'Tell me about yourself and your experience with React.', position: 1 },
          { id: '2', question_text: 'How do you handle state management in large applications?', position: 2 },
          { id: '3', question_text: 'Describe a challenging project you worked on recently.', position: 3 },
        ]
      };
      setJob(mockJob);
      setResponses(new Array(mockJob.questions.length).fill(''));
    } catch (error: any) {
      setError(error.message || 'Failed to load interview');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // TODO: Implement actual recording logic
  };

  const stopRecording = () => {
    setIsRecording(false);
    // TODO: Save response and move to next question
    const newResponses = [...responses];
    newResponses[currentQuestionIndex] = `Response to question ${currentQuestionIndex + 1}`;
    setResponses(newResponses);
  };

  const nextQuestion = () => {
    if (job && currentQuestionIndex < job.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Interview complete
      alert('Interview completed! Thank you for your time.');
      navigate('/candidate');
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return <div className="p-8">Loading interview...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!job) {
    return <div className="p-8">Interview not found</div>;
  }

  const currentQuestion = job.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / job.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-300">
              Question {currentQuestionIndex + 1} of {job.questions.length}
            </p>
            <div className="text-sm text-gray-400">
              Progress: {Math.round(progress)}%
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Video/Audio Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-center space-x-4 mb-4">
            <Button
              onClick={() => setVideoEnabled(!videoEnabled)}
              variant={videoEnabled ? "default" : "outline"}
              size="lg"
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>
          <div className="text-center">
            <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">
                {videoEnabled ? 'Camera feed would appear here' : 'Camera disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Question</h2>
          <p className="text-lg leading-relaxed">{currentQuestion.question_text}</p>
        </div>

        {/* Recording Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recording Status</h3>
              <p className="text-gray-400">
                {isRecording ? 'Recording your response...' : 'Click the microphone to start recording'}
              </p>
            </div>
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400">Recording</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={nextQuestion}
            disabled={isRecording}
          >
            {currentQuestionIndex === job.questions.length - 1 ? 'Complete Interview' : 'Next Question'}
          </Button>
        </div>
      </div>
    </div>
  );
}
