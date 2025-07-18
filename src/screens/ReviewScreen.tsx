import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { apiService, Question } from '../services/api';

interface ReviewScreenProps {
  onBack: () => void;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ onBack }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    flex: 1,
  };

  useEffect(() => {
    loadReviewQuestions();
  }, []);

  const loadReviewQuestions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading review questions...');
      
      const questions = await apiService.getMissedQuestions();
      console.log('📚 Received questions:', questions.length);
      console.log('📚 Questions:', questions);
      
      if (questions.length === 0) {
        console.log('❌ No missed questions found');
        setReviewComplete(true);
      } else {
        console.log('✅ Setting review questions:', questions.length);
        setReviewQuestions(questions);
      }
    } catch (error) {
      console.error('❌ Failed to load review questions:', error);
      Alert.alert('Error', 'Failed to load review questions. You might need to answer some questions incorrectly first!');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    setSubmitting(true);

    try {
      const result = await apiService.submitAnswer({
        questionId: currentQuestion.id,
        userAnswer: selectedAnswer,
      });

      setShowExplanation(true);

      // Show immediate feedback
      setTimeout(() => {
        Alert.alert(
          result.correct ? '🎉 Correct!' : '❌ Still Incorrect',
          result.explanation,
          [
            { 
              text: 'Next Question', 
              onPress: () => {
                if (currentQuestionIndex < reviewQuestions.length - 1) {
                  // Move to next question
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                } else {
                  // Review session complete
                  setReviewComplete(true);
                }
              }
            }
          ]
        );
      }, 500);

    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = reviewQuestions[currentQuestionIndex];

  const getOptionStyle = (option: string) => {
    if (!showExplanation) {
      return [
        styles.optionButton,
        selectedAnswer === option && styles.selectedOption
      ];
    }

    if (currentQuestion && option === currentQuestion.correct_answer) {
      return [styles.optionButton, styles.correctOption];
    } else if (option === selectedAnswer && currentQuestion && option !== currentQuestion.correct_answer) {
      return [styles.optionButton, styles.incorrectOption];
    } else {
      return [styles.optionButton, styles.disabledOption];
    }
  };

  const getQuestionTypeTitle = (type: string) => {
    switch (type) {
      case 'strengthen': return 'Strengthen the Argument';
      case 'weaken': return 'Weaken the Argument';
      case 'assumption': return 'Find the Assumption';
      case 'flaw': return 'Identify the Flaw';
      default: return 'Logical Reasoning';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={[styles.loadingText, {color: isDarkMode ? '#fff' : '#333'}]}>
            Loading review questions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (reviewComplete || reviewQuestions.length === 0) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.completionContainer}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={[styles.completionTitle, {color: isDarkMode ? '#fff' : '#333'}]}>
            {reviewQuestions.length === 0 ? 'No Review Needed!' : 'Review Complete!'}
          </Text>
          <Text style={[styles.completionMessage, {color: isDarkMode ? '#ccc' : '#666'}]}>
            {reviewQuestions.length === 0 
              ? 'You haven\'t missed any questions yet. Keep practicing to build your review queue!'
              : `Great job! You've reviewed ${reviewQuestions.length} questions. These will come up again later based on spaced repetition.`
            }
          </Text>
          
          <View style={styles.completionStats}>
            <Text style={styles.statsTitle}>Review Session Stats:</Text>
            <Text style={styles.statsText}>
              Questions Reviewed: {currentQuestionIndex}
            </Text>
            <Text style={styles.statsText}>
              Next Review: Questions will reappear based on your performance
            </Text>
          </View>

          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBackButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Review Mode</Text>
          <Text style={styles.headerSubtitle}>
            {currentQuestionIndex + 1} of {reviewQuestions.length}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.questionTypeLabel}>
            {getQuestionTypeTitle(currentQuestion.type)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBar,
              { width: `${((currentQuestionIndex + 1) / reviewQuestions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content}>
        {/* Review Info Banner */}
        <View style={styles.reviewBanner}>
          <Text style={styles.reviewBannerEmoji}>🔄</Text>
          <View style={styles.reviewBannerText}>
            <Text style={styles.reviewBannerTitle}>Review Question</Text>
            <Text style={styles.reviewBannerSubtitle}>
              You missed this question before. Let's try again!
            </Text>
          </View>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getOptionStyle(option.charAt(0))}
              onPress={() => handleAnswerSelect(option.charAt(0))}
              disabled={showExplanation}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showExplanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Explanation:</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
            
            {/* Spaced Repetition Info */}
            <View style={styles.spacedRepetitionInfo}>
              <Text style={styles.spacedRepetitionTitle}>📅 Spaced Repetition</Text>
              <Text style={styles.spacedRepetitionText}>
                {selectedAnswer === currentQuestion.correct_answer
                  ? 'Great! This question will appear again in a few days to reinforce your learning.'
                  : 'This question will appear again soon so you can master it.'
                }
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {!showExplanation ? (
          <TouchableOpacity
            style={[styles.submitButton, (!selectedAnswer || submitting) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!selectedAnswer || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              if (currentQuestionIndex < reviewQuestions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setSelectedAnswer(null);
                setShowExplanation(false);
              } else {
                setReviewComplete(true);
              }
            }}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < reviewQuestions.length - 1 ? 'Next Question' : 'Complete Review'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  questionTypeLabel: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: '500',
  },
  headerBackButton: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: '500',
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 20,
  },
  reviewBannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  reviewBannerText: {
    flex: 1,
  },
  reviewBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 2,
  },
  reviewBannerSubtitle: {
    fontSize: 14,
    color: '#856404',
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOption: {
    borderColor: '#2196f3',
    backgroundColor: '#e3f2fd',
  },
  correctOption: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  incorrectOption: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  explanationContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 15,
  },
  spacedRepetitionInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#17a2b8',
  },
  spacedRepetitionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#17a2b8',
    marginBottom: 4,
  },
  spacedRepetitionText: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  completionMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  completionStats: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  backButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewScreen;