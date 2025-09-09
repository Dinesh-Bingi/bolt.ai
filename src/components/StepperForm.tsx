import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';

interface Step {
  id: string;
  title: string;
  question: string;
  placeholder: string;
}

interface StepperFormProps {
  onComplete: (answers: Record<string, string>) => Promise<void>;
  loading?: boolean;
}

const steps: Step[] = [
  {
    id: 'childhood',
    title: 'Early Life',
    question: 'Tell me about your childhood. What are your most cherished memories from growing up?',
    placeholder: 'Share your favorite childhood memories, family traditions, or early experiences that shaped who you became...'
  },
  {
    id: 'career',
    title: 'Career Journey',
    question: 'What was your career path? What work brought you the most fulfillment?',
    placeholder: 'Describe your professional journey, achievements, challenges, and what you were most proud of...'
  },
  {
    id: 'love',
    title: 'Love & Relationships',
    question: 'Tell me about love in your life. What relationships meant the most to you?',
    placeholder: 'Share about your family, spouse, children, friends, and the relationships that defined your life...'
  },
  {
    id: 'struggles',
    title: 'Challenges & Growth',
    question: 'What were your greatest challenges? How did you overcome them?',
    placeholder: 'Reflect on difficult times, how you persevered, and what these experiences taught you...'
  },
  {
    id: 'values',
    title: 'Values & Beliefs',
    question: 'What principles guided your life? What do you believe in most deeply?',
    placeholder: 'Share your core values, beliefs, philosophy of life, and what you stand for...'
  },
  {
    id: 'advice',
    title: 'Legacy & Wisdom',
    question: 'What advice would you give to future generations? What wisdom do you want to pass on?',
    placeholder: 'Share your life lessons, advice for loved ones, and the wisdom you want to leave behind...'
  }
];

export default function StepperForm({ onComplete, loading = false }: StepperFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    const stepId = steps[currentStep].id;
    const updatedAnswers = { ...answers, [stepId]: currentAnswer };
    setAnswers(updatedAnswers);
    
    if (currentStep === steps.length - 1) {
      // This is the final step - complete the form
      setSaving(true);
      try {
        await onComplete(updatedAnswers);
        // Show success message
        alert('Your life story has been saved successfully! You can now view your memorial page.');
      } catch (error) {
        console.error('Failed to save story:', error);
        alert('Failed to save your story. Please try again.');
      } finally {
        setSaving(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
      setCurrentAnswer(answers[steps[currentStep + 1]?.id] || '');
    }
  };

  const handlePrevious = () => {
    const stepId = steps[currentStep].id;
    setAnswers(prev => ({ ...prev, [stepId]: currentAnswer }));
    setCurrentStep(prev => prev - 1);
    setCurrentAnswer(answers[steps[currentStep - 1]?.id] || '');
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <GlassCard className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h2>
            <p className="text-gray-300 text-lg">{currentStepData.question}</p>
          </div>

          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={currentStepData.placeholder}
            rows={8}
            className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
          />

          <div className="flex justify-between mt-6">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              disabled={currentStep === 0}
              icon={ArrowLeft}
            >
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!currentAnswer.trim() || saving || loading}
              icon={currentStep === steps.length - 1 ? undefined : ArrowRight}
            >
              {saving ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete Your Legacy' : 'Next Step'}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
}