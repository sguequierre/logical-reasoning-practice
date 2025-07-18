import ReviewScreen from './src/screens/ReviewScreen';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiService, Question, User } from './src/services/api';
import AuthScreen from './src/screens/AuthScreen';

const App = (): React.JSX.Element => {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentScreen, setCurrentScreen] = useState<'loading' | 'auth' | 'home' | 'question' | 'review'>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [stats, setStats] = useState({
    questionsAnswered: 0,
    accuracy: 0,
    currentStreak: 0,
    longestStreak: 0,
    accuracyByType: {
      strengthen: 0,
      weaken: 0,
      assumption: 0,
      flaw: 0,
    },
    correctAnswers: 0,
  });

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    flex: 1,
  };

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (apiService.isAuthenticated()) {
        // Try to get user profile to verify token is still valid
        const profileResponse = await apiService.getProfile();
        setCurrentUser(profileResponse.user);
        setCurrentScreen('home');
        loadUserStats();
      } else {
        setCurrentScreen('auth');
      }
    } catch (error) {
      // Token might be expired or invalid
      console.error('Auth check failed:', error);
      setCurrentScreen('auth');
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('home');
    if (user.id !== 0) { // Not guest mode
      loadUserStats();
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              setCurrentUser(null);
              setCurrentScreen('auth');
              // Reset stats
              setStats({
                questionsAnswered: 0,
                accuracy: 0,
                currentStreak: 0,
                longestStreak: 0,
                accuracyByType: { strengthen: 0, weaken: 0, assumption: 0, flaw: 0 },
                correctAnswers: 0,
              });
            } catch (error) {
              console.error('Logout failed:', error);
            }
          }
        }
      ]
    );
  };

  const loadUserStats = async () => {
    try {
      const userStats = await apiService.getUserStats();
      setStats({
        questionsAnswered: userStats.questionsAnswered || 0,
        accuracy: userStats.accuracy || 0,
        currentStreak: userStats.currentStreak || 0,
        longestStreak: userStats.longestStreak || 0,
        accuracyByType: userStats.accuracyByType || {
          strengthen: 0,
          weaken: 0,
          assumption: 0,
          flaw: 0,
        },
        correctAnswers: userStats.correctAnswers || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const navigateToQuestion = async (questionType: string) => {
    setLoading(true);
    setCurrentScreen('question');
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuestionStartTime(Date.now());

    try {
      const question = await apiService.generateQuestion({ type: questionType as any });
      setCurrentQuestion(question);
    } catch (error) {
      Alert.alert('Error', 'Failed to load question. Please try again.');
      setCurrentScreen('home');
    } finally {
      setLoading(false);
    }
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    if (currentUser && currentUser.id !== 0) { // Not guest mode
      loadUserStats();
    }
  };

  const navigateToReview = () => {
    setCurrentScreen('review');
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) {
      Alert.alert('Please select an answer', 'Choose one of the options before submitting.');
      return;
    }

    setLoading(true);

    try {
      const responseTime = Math.round((Date.now() - questionStartTime) / 1000);
      
      const result = await apiService.submitAnswer({
        questionId: currentQuestion.id,
        userAnswer: selectedAnswer,
        responseTime: responseTime,
      });

      setShowExplanation(true);

      setTimeout(() => {
        const timeMessage = responseTime > 0 ? `\n\nResponse time: ${responseTime} seconds` : '';
        
        Alert.alert(
          result.correct ? '🎉 Correct!' : '❌ Incorrect',
          result.explanation + timeMessage,
          [
            { text: 'Next Question', onPress: () => navigateToQuestion(currentQuestion.type) },
            { text: 'Back to Menu', onPress: navigateToHome }
          ]
        );
      }, 500);

    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const getStreakMessage = () => {
    if (stats.currentStreak === 0) return '';
    if (stats.currentStreak === 1) return '🔥 1 in a row!';
    if (stats.currentStreak < 5) return `🔥 ${stats.currentStreak} in a row!`;
    if (stats.currentStreak < 10) return `🔥🔥 ${stats.currentStreak} streak!`;
    return `🔥🔥🔥 ${stats.currentStreak} streak! Amazing!`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return '#4caf50';
    if (accuracy >= 70) return '#ff9800';
    if (accuracy >= 60) return '#ff5722';
    return '#f44336';
  };

  // Loading screen
  if (currentScreen === 'loading') {
    return (
      <View style={[backgroundStyle, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={{ marginTop: 10, color: isDarkMode ? '#fff' : '#333' }}>
          Loading Logic Master...
        </Text>
      </View>
    );
  }

  // Authentication screen
  if (currentScreen === 'auth') {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Question screen
  if (currentScreen === 'question') {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateToHome}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentQuestion ? getQuestionTypeTitle(currentQuestion.type) : 'Loading...'}
          </Text>
          {currentUser && currentUser.id !== 0 && (
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutButton}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && !currentQuestion ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196f3" />
            <Text style={styles.loadingText}>Generating question...</Text>
          </View>
        ) : currentQuestion ? (
          <>
            <ScrollView style={styles.content}>
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
              </View>

              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={getOptionStyle(option.charAt(0))}
                    onPress={() => handleAnswerSelect(option.charAt(0))}
                    disabled={showExplanation || loading}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showExplanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>Explanation:</Text>
                  <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              {!showExplanation ? (
                <TouchableOpacity
                  style={[styles.submitButton, (!selectedAnswer || loading) && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={!selectedAnswer || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Answer</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.resultButtons}>
                  <TouchableOpacity 
                    style={styles.nextButton} 
                    onPress={() => navigateToQuestion(currentQuestion.type)}
                  >
                    <Text style={styles.buttonText}>Next Question</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.homeButton} onPress={navigateToHome}>
                    <Text style={styles.buttonText}>Back to Menu</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load question</Text>
            <TouchableOpacity style={styles.retryButton} onPress={navigateToHome}>
              <Text style={styles.retryButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Review Screen
  if (currentScreen === 'review') {
    return <ReviewScreen onBack={navigateToHome} />;
  }

  // Home Screen
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView style={backgroundStyle}>
        <View style={styles.container}>
          {/* Header with user info and logout/signup */}
          <View style={styles.headerSection}>
            <View style={styles.userHeader}>
              <View>
                <Text style={[styles.title, {color: isDarkMode ? '#fff' : '#333'}]}>
                  Logic Master
                </Text>
                <Text style={[styles.subtitle, {color: isDarkMode ? '#ccc' : '#666'}]}>
                  Master Logical Reasoning
                </Text>
              </View>
              {currentUser && (
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, {color: isDarkMode ? '#fff' : '#333'}]}>
                    {currentUser.username}
                  </Text>
                  {currentUser.id !== 0 ? (
                    // Logged in user - show logout
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButtonSmall}>
                      <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                  ) : (
                    // Guest user - show sign up option
                    <TouchableOpacity onPress={() => setCurrentScreen('auth')} style={styles.signUpButtonSmall}>
                      <Text style={styles.signUpButtonText}>Sign Up</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            {stats.currentStreak > 0 && (
              <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
            )}
          </View>

          <View style={styles.practiceSection}>
            <TouchableOpacity 
              style={styles.practiceButton} 
              onPress={() => navigateToQuestion('strengthen')}
              disabled={loading}
            >
              <Text style={styles.practiceButtonText}>🧠 Strengthen Arguments</Text>
              <Text style={styles.practiceButtonSubtext}>
                Practice identifying what strengthens an argument
              </Text>
              {stats.accuracyByType?.strengthen > 0 && (
                <Text style={[styles.accuracyBadge, { color: getAccuracyColor(stats.accuracyByType.strengthen) }]}>
                  {stats.accuracyByType.strengthen}% accuracy
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.practiceButton, styles.weakenButton]} 
              onPress={() => navigateToQuestion('weaken')}
              disabled={loading}
            >
              <Text style={styles.practiceButtonText}>🔍 Weaken Arguments</Text>
              <Text style={styles.practiceButtonSubtext}>
                Find what undermines the reasoning
              </Text>
              {stats.accuracyByType?.weaken > 0 && (
                <Text style={[styles.accuracyBadge, { color: getAccuracyColor(stats.accuracyByType.weaken) }]}>
                  {stats.accuracyByType.weaken}% accuracy
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.practiceButton, styles.assumptionButton]} 
              onPress={() => navigateToQuestion('assumption')}
              disabled={loading}
            >
              <Text style={styles.practiceButtonText}>🎯 Find Assumptions</Text>
              <Text style={styles.practiceButtonSubtext}>
                Identify unstated premises
              </Text>
              {stats.accuracyByType?.assumption > 0 && (
                <Text style={[styles.accuracyBadge, { color: getAccuracyColor(stats.accuracyByType.assumption) }]}>
                  {stats.accuracyByType.assumption}% accuracy
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.practiceButton, styles.flawButton]} 
              onPress={() => navigateToQuestion('flaw')}
              disabled={loading}
            >
              <Text style={styles.practiceButtonText}>❌ Logical Flaws</Text>
              <Text style={styles.practiceButtonSubtext}>
                Spot errors in reasoning
              </Text>
              {stats.accuracyByType?.flaw > 0 && (
                <Text style={[styles.accuracyBadge, { color: getAccuracyColor(stats.accuracyByType.flaw) }]}>
                  {stats.accuracyByType.flaw}% accuracy
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, {color: isDarkMode ? '#fff' : '#333'}]}>
              Your Progress
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.questionsAnswered}</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: getAccuracyColor(stats.accuracy) }]}>
                  {stats.accuracy}%
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.longestStreak}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.reviewButton} onPress={navigateToReview}>
            <Text style={styles.reviewButtonText}>📚 Review Missed Questions</Text>
            <Text style={styles.reviewSubtext}>
              Practice questions you got wrong ({stats.questionsAnswered - stats.correctAnswers} available)
            </Text>
          </TouchableOpacity>

          {/* Guest Mode Upgrade Banner */}
          {currentUser && currentUser.id === 0 && (
            <View style={styles.guestBanner}>
              <View style={styles.guestBannerContent}>
                <Text style={styles.guestBannerTitle}>🎯 Want to Save Your Progress?</Text>
                <Text style={styles.guestBannerText}>
                  Create an account to track your improvement, review missed questions, and access your stats from any device!
                </Text>
                <TouchableOpacity 
                  style={styles.guestUpgradeButton}
                  onPress={() => setCurrentScreen('auth')}
                >
                  <Text style={styles.guestUpgradeButtonText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196f3" />
              <Text style={styles.loadingText}>Preparing your practice session...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 30,
    paddingTop: 20,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  logoutButtonSmall: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  signUpButtonSmall: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  streakMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
    textAlign: 'center',
  },
  practiceSection: {
    marginBottom: 30,
  },
  practiceButton: {
    backgroundColor: '#2196f3',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    position: 'relative',
  },
  weakenButton: {
    backgroundColor: '#ff9800',
  },
  assumptionButton: {
    backgroundColor: '#9c27b0',
  },
  flawButton: {
    backgroundColor: '#f44336',
  },
  practiceButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  practiceButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  accuracyBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  reviewButton: {
    backgroundColor: '#4caf50',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reviewSubtext: {
    color: '#e8f5e8',
    fontSize: 14,
    textAlign: 'center',
  },
  guestBanner: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestBannerContent: {
    alignItems: 'center',
  },
  guestBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestBannerText: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  guestUpgradeButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  guestUpgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Question Screen Styles
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
  backButton: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  logoutButton: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
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
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;