import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';

// Sample question data (we'll replace this with API calls later)
const sampleQuestion = {
  id: 1,
  type: 'strengthen',
  question: `A local restaurant owner claims that installing outdoor heaters will significantly increase winter revenue. She argues that customers will be more likely to dine outside during cold months if the patio is heated, thus expanding seating capacity when indoor dining is limited.

Which of the following, if true, most strengthens the restaurant owner's argument?`,
  options: [
    'A) Other restaurants in the area have reported increased winter sales after installing outdoor heaters',
    'B) The cost of outdoor heaters can be recovered within six months of installation',
    'C) Many customers prefer dining outdoors regardless of temperature',
    'D) The restaurant currently has a waiting list during peak dinner hours in winter',
    'E) Outdoor heaters consume significant amounts of energy'
  ],
  correctAnswer: 'A',
  explanation: 'Option A strengthens the argument by providing concrete evidence that outdoor heaters have actually resulted in increased winter sales for similar restaurants. This directly supports the owner\'s prediction about increased revenue.'
};

interface QuestionScreenProps {
  route?: {
    params?: {
      questionType?: string;
    };
  };
  navigation?: any;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({ route, navigation }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const questionType = route?.params?.questionType || 'strengthen';

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return; // Don't allow changing after submission
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) {
      Alert.alert('Please select an answer', 'Choose one of the options before submitting.');
      return;
    }

    const correct = selectedAnswer === sampleQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);

    // Show result alert
    setTimeout(() => {
      Alert.alert(
        correct ? '🎉 Correct!' : '❌ Incorrect',
        sampleQuestion.explanation,
        [
          {
            text: 'Next Question',
            onPress: generateNewQuestion
          },
          {
            text: 'Back to Menu',
            onPress: () => navigation?.goBack()
          }
        ]
      );
    }, 500);
  };

  const generateNewQuestion = () => {
    // Reset state for new question
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsCorrect(null);
    // In the future, this will call the API to generate a new question
  };

  const getOptionStyle = (option: string) => {
    if (!showExplanation) {
      return [
        styles.optionButton,
        selectedAnswer === option && styles.selectedOption
      ];
    }

    // After submission, show correct/incorrect
    if (option === sampleQuestion.correctAnswer) {
      return [styles.optionButton, styles.correctOption];
    } else if (option === selectedAnswer && option !== sampleQuestion.correctAnswer) {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.questionType}>{getQuestionTypeTitle(questionType)}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{sampleQuestion.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {sampleQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getOptionStyle(option.charAt(0))}
              onPress={() => handleAnswerSelect(option.charAt(0))}
              disabled={showExplanation}
            >
              <Text style={[
                styles.optionText,
                selectedAnswer === option.charAt(0) && !showExplanation && styles.selectedOptionText,
                showExplanation && option.charAt(0) === sampleQuestion.correctAnswer && styles.correctOptionText,
                showExplanation && option.charAt(0) === selectedAnswer && option.charAt(0) !== sampleQuestion.correctAnswer && styles.incorrectOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showExplanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Explanation:</Text>
            <Text style={styles.explanationText}>{sampleQuestion.explanation}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!showExplanation ? (
          <TouchableOpacity
            style={[styles.submitButton, !selectedAnswer && styles.disabledSubmitButton]}
            onPress={handleSubmit}
            disabled={!selectedAnswer}
          >
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={generateNewQuestion}
            >
              <Text style={styles.nextButtonText}>Next Question</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation?.goBack()}
            >
              <Text style={styles.menuButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: '500',
  },
  questionType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  selectedOptionText: {
    color: '#2196f3',
    fontWeight: '500',
  },
  correctOptionText: {
    color: '#4caf50',
    fontWeight: '500',
  },
  incorrectOptionText: {
    color: '#f44336',
    fontWeight: '500',
  },
  explanationContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
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
  disabledSubmitButton: {
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
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButton: {
    flex: 1,
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuestionScreen;