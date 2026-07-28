'use client';

import React, { useState, useEffect } from 'react';

import { quizDatabase } from '../lib/quizDatabase';

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface CodexQuizProps {
  courseId: string;
  part: number;
  onComplete: () => void;
}

export function CodexQuiz({ courseId, part, onComplete }: CodexQuizProps) {
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');

  const getQuestions = (): Question[] => {
    let baseCourseId = courseId;
    if (courseId.startsWith('data-analyst')) baseCourseId = 'data-analyst';
    
    const courseQuizzes = quizDatabase[baseCourseId];
    if (courseQuizzes && courseQuizzes[part]) {
      return courseQuizzes[part];
    }
    // Fallback
    return [{
      question: `Review: What is a primary key in a database?`,
      options: [
        "A password used to access the database",
        "A unique identifier for each record in a table",
        "The most important column in a spreadsheet",
        "A script that runs every night at midnight"
      ],
      correctIndex: 1,
      explanation: "A primary key ensures that every row in a table can be uniquely identified, preventing duplicate records."
    }];
  };

  const activeQuestions = getQuestions();
  const safeIdx = Math.min(currentQIdx, activeQuestions.length - 1);
  const activeQuestion = activeQuestions[safeIdx];


  // Reset quiz state when part changes
  useEffect(() => {
    setCurrentQIdx(0);
    setSelectedAnswer(null);
    setQuizState('unanswered');
  }, [part, courseId]);

  const handleSubmit = (index: number) => {
    if (quizState !== 'unanswered') return;
    setSelectedAnswer(index);
    if (index === activeQuestion.correctIndex) {
      setQuizState('correct');
      if (currentQIdx === activeQuestions.length - 1) {
        onComplete();
      }
    } else {
      setQuizState('wrong');
    }
  };

  const handleNextQuestion = () => {
    if (currentQIdx < activeQuestions.length - 1) {
      setCurrentQIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setQuizState('unanswered');
    }
  };

  return (
    <div className="codex-quiz raised">
      <div className="quiz-scroll-header">
        <span className="quiz-badge">📜 Codex Quiz</span>
        <h4 className="quiz-part-title">Test of Mastery — Chapter {part} <span style={{fontSize: '0.8rem', opacity: 0.8}}>(Q{currentQIdx + 1}/{activeQuestions.length})</span></h4>
      </div>

      <div className="quiz-scroll-content">
        <p className="quiz-question">{activeQuestion.question}</p>
        
        <div className="quiz-options">
          {activeQuestion.options.map((opt, idx) => (
            <button
              key={idx}
              className={`quiz-option-btn ${
                selectedAnswer === idx 
                  ? quizState === 'correct' 
                    ? 'correct' 
                    : 'wrong' 
                  : ''
              } ${quizState !== 'unanswered' && idx === activeQuestion.correctIndex ? 'correct-highlight' : ''}`}
              disabled={quizState !== 'unanswered'}
              onClick={() => handleSubmit(idx)}
            >
              <span className="option-letter">{['A', 'B', 'C', 'D'][idx]}.</span>
              <span className="option-text">{opt}</span>
            </button>
          ))}
        </div>

        {quizState !== 'unanswered' && (
          <div className={`quiz-feedback ${quizState}`}>
            <div className="feedback-headline">
              {quizState === 'correct' ? '🎉 Mechanical Design Confirmed!' : '⚠️ Gears Jammed!'}
            </div>
            <p className="feedback-explanation">{activeQuestion.explanation}</p>
            {quizState === 'correct' && currentQIdx < activeQuestions.length - 1 && (
              <button 
                className="next-question-btn" 
                onClick={handleNextQuestion}
              >
                Next Question →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Visual Rotating Gears Animation representing mechanical alignment */}
      <div className="quiz-gears-footer">
        <div className={`gear small-gear ${quizState === 'correct' ? 'spinning-cw' : quizState === 'wrong' ? 'jammed' : ''}`} />
        <div className={`gear large-gear ${quizState === 'correct' ? 'spinning-ccw' : quizState === 'wrong' ? 'jammed' : ''}`} />
        <div className={`gear medium-gear ${quizState === 'correct' ? 'spinning-cw' : quizState === 'wrong' ? 'jammed' : ''}`} />
      </div>

      <style jsx>{`
        .codex-quiz {
          margin-top: 24px;
          border: 2px solid var(--border);
          background: #fdfaf2; /* always parchment/scroll */
          color: #2b1803;
          padding: 16px;
          font-family: 'EB Garamond', Georgia, serif;
          position: relative;
          overflow: hidden;
          box-shadow: 4px 4px 0 var(--win-shadow);
        }

        .quiz-scroll-header {
          border-bottom: 2px double var(--border);
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .quiz-badge {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          background: #8b0000;
          color: #fdfaf2;
          padding: 1px 6px;
          border: 1px solid #4c3821;
          font-weight: bold;
          text-transform: uppercase;
        }

        .quiz-part-title {
          font-family: 'Cinzel', serif;
          font-size: 1.05rem;
          margin-top: 6px;
          color: #8b0000;
        }

        .quiz-question {
          font-size: 1.05rem;
          font-weight: bold;
          line-height: 1.4;
          margin-bottom: 14px;
        }

        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quiz-option-btn {
          text-align: left;
          padding: 8px 12px;
          background: #fefcf7;
          border: 1px solid #4c3821;
          color: #2b1803;
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.1s ease;
          display: flex;
          gap: 8px;
        }

        .quiz-option-btn:hover:not(:disabled) {
          background: #f5ecd5;
          transform: translateX(4px);
        }

        .option-letter {
          font-family: 'Cinzel', serif;
          font-weight: bold;
          color: #8b0000;
        }

        .quiz-option-btn.correct {
          background: #d4edda !important;
          border-color: #28a745 !important;
          color: #155724 !important;
        }

        .quiz-option-btn.wrong {
          background: #f8d7da !important;
          border-color: #dc3545 !important;
          color: #721c24 !important;
        }

        .correct-highlight {
          border-color: #28a745 !important;
          background: #e2f0d9 !important;
        }

        .quiz-feedback {
          margin-top: 14px;
          padding: 10px;
          border: 1px solid var(--border);
          background: #fefcf7;
        }

        .quiz-feedback.correct {
          border-left: 4px solid #28a745;
        }

        .quiz-feedback.wrong {
          border-left: 4px solid #dc3545;
        }

        .feedback-headline {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .correct .feedback-headline { color: #28a745; }
        .wrong .feedback-headline { color: #dc3545; }

        .feedback-explanation {
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .next-question-btn {
          margin-top: 12px;
          padding: 6px 16px;
          background: #28a745;
          color: white;
          border: none;
          font-family: 'Cinzel', serif;
          font-weight: bold;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .next-question-btn:hover {
          background: #218838;
        }

        /* Spinning gears */
        .quiz-gears-footer {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
          margin-top: 12px;
          height: 30px;
          opacity: 0.7;
        }

        .gear {
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234c3821' stroke-width='2'%3E%3Cpath d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83'/%3E%3Ccircle cx='12' cy='12' r='5'/%3E%3C/svg%3E") no-repeat center;
          background-size: contain;
        }

        .small-gear { width: 16px; height: 16px; align-self: flex-end; }
        .medium-gear { width: 22px; height: 22px; align-self: center; }
        .large-gear { width: 30px; height: 30px; }

        .spinning-cw {
          animation: spin 3s linear infinite;
        }

        .spinning-ccw {
          animation: spin-reverse 3s linear infinite;
        }

        .jammed {
          animation: jam 0.3s ease-in-out infinite alternate;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes jam {
          from { transform: rotate(-5deg); }
          to { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
