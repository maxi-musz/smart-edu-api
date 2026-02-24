import { Injectable, Logger } from '@nestjs/common';
import * as colors from 'colors';
import { GradingResult, AssessmentContextType } from './assessment.types';

/**
 * Assessment Grading Service
 * 
 * Handles all grading-related utilities including:
 * - Answer normalization
 * - Answer correctness checking
 * - Score calculation
 * - Grade letter assignment
 * - Array shuffling for randomization
 */
@Injectable()
export class AssessmentGradingService {
  private readonly logger = new Logger(AssessmentGradingService.name);

  /**
   * Normalize answers from frontend format
   * Supports both selected_options array and single "answer" string
   */
  normalizeAnswers(answers: any[]): any[] {
    return (answers || []).map((a: any) => {
      const normalized = { ...a };
      // Support both selected_options array and single "answer" string
      if (normalized.selected_options == null && normalized.answer != null) {
        normalized.selected_options = Array.isArray(normalized.answer)
          ? normalized.answer
          : [normalized.answer];
      }
      return normalized;
    });
  }

  /**
   * Grade school assessment answers
   */
  gradeSchoolAnswers(answers: any[], questions: any[]): GradingResult {
    let totalScore = 0;
    let totalPoints = 0;
    const gradedAnswers: any[] = [];

    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.question_id);
      if (!question) {
        this.logger.warn(colors.yellow(`Question not found: ${answer.question_id}`));
        continue;
      }

      const isCorrect = this.checkAnswerCorrectness(answer, question, 'school');
      const pointsEarned = isCorrect ? question.points : 0;

      gradedAnswers.push({
        question_id: answer.question_id,
        question_type: answer.question_type || question.question_type,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        max_points: question.points,
        selected_options: answer.selected_options || [],
        text_answer: answer.text_answer,
        numeric_answer: answer.question_type === 'NUMERIC' && answer.text_answer ? parseFloat(answer.text_answer) : null,
        date_answer: answer.question_type === 'DATE' && answer.text_answer ? new Date(answer.text_answer) : null,
      });

      totalScore += pointsEarned;
      totalPoints += question.points;
    }

    return { gradedAnswers, totalScore, totalPoints };
  }

  /**
   * Grade library assessment answers
   */
  gradeLibraryAnswers(answers: any[], questions: any[]): GradingResult {
    let totalScore = 0;
    let totalPoints = 0;
    const gradedAnswers: any[] = [];

    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.question_id);
      if (!question) {
        this.logger.warn(colors.yellow(`Question not found: ${answer.question_id}`));
        continue;
      }

      const isCorrect = this.checkAnswerCorrectness(answer, question, 'library');
      const pointsEarned = isCorrect ? question.points : 0;

      gradedAnswers.push({
        question_id: answer.question_id,
        question_type: answer.question_type || question.questionType,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        max_points: question.points,
        selected_options: answer.selected_options || [],
        text_answer: answer.text_answer,
        numeric_answer: answer.question_type === 'NUMERIC' && answer.text_answer ? parseFloat(answer.text_answer) : null,
        date_answer: answer.question_type === 'DATE' && answer.text_answer ? new Date(answer.text_answer) : null,
      });

      totalScore += pointsEarned;
      totalPoints += question.points;
    }

    return { gradedAnswers, totalScore, totalPoints };
  }

  /**
   * Check if an answer is correct
   */
  checkAnswerCorrectness(answer: any, question: any, context: AssessmentContextType): boolean {
    // Get correct answers based on context (different field names)
    const correctAnswers = context === 'school' ? question.correct_answers : question.correctAnswers;
    const questionType = context === 'school' ? question.question_type : question.questionType;

    if (!correctAnswers || correctAnswers.length === 0) {
      // Fallback: check options' is_correct flag
      const selectedOptions = answer.selected_options || [];
      if (selectedOptions.length > 0) {
        const options = question.options || [];
        const correctOptionIds = options
          .filter((o: any) => (context === 'school' ? o.is_correct : o.isCorrect))
          .map((o: any) => o.id);
        
        if (correctOptionIds.length > 0) {
          const studentOptions = [...selectedOptions].sort();
          const correctSorted = [...correctOptionIds].sort();
          return JSON.stringify(studentOptions) === JSON.stringify(correctSorted);
        }
      }
      return false;
    }

    const correctAnswer = correctAnswers[0];
    const selectedOptions = answer.selected_options || [];
    const optionIds = context === 'school' ? correctAnswer.option_ids : correctAnswer.optionIds;

    switch (questionType) {
      case 'MULTIPLE_CHOICE':
      case 'MULTIPLE_CHOICE_SINGLE':
      case 'TRUE_FALSE':
        if (selectedOptions.length > 0 && optionIds) {
          const studentOptions = [...selectedOptions].sort();
          const correctOptions = [...(optionIds || [])].sort();
          return JSON.stringify(studentOptions) === JSON.stringify(correctOptions);
        }
        break;

      case 'FILL_IN_BLANK':
      case 'SHORT_ANSWER':
        const answerText = context === 'school' ? correctAnswer.answer_text : correctAnswer.answerText;
        if (answer.text_answer && answerText) {
          return answer.text_answer.toLowerCase().trim() === answerText.toLowerCase().trim();
        }
        break;

      case 'NUMERIC':
        const answerNumber = context === 'school' ? correctAnswer.answer_number : correctAnswer.answerNumber;
        if (answer.text_answer && answerNumber !== undefined) {
          const studentNumber = parseFloat(answer.text_answer);
          return !isNaN(studentNumber) && Math.abs(studentNumber - answerNumber) < 0.01;
        }
        break;

      case 'DATE':
        const answerDate = context === 'school' ? correctAnswer.answer_date : correctAnswer.answerDate;
        if (answer.text_answer && answerDate) {
          const studentDate = new Date(answer.text_answer);
          const correctDate = new Date(answerDate);
          return !isNaN(studentDate.getTime()) && studentDate.getTime() === correctDate.getTime();
        }
        break;

      case 'ESSAY':
        // Essays require manual grading, return false for auto-grade
        return false;
    }

    return false;
  }

  /**
   * Calculate grade letter based on percentage
   */
  calculateGrade(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }

  /**
   * Fisher-Yates shuffle algorithm
   * Used for randomizing questions and options
   */
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
