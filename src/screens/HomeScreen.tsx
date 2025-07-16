import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    flex: 1,
  };

  const navigateToQuestion = (questionType: string) => {
    navigation.navigate('Question', { questionType });
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, {color: isDarkMode ? '#fff' : '#333'}]}>
              Logic Master
            </Text>
            <Text style={[styles.subtitle, {color: isDarkMode ? '#ccc' : '#666'}]}>
              Master Logical Reasoning
            </Text>
          </View>

          {/* Practice Options */}
          <View style={styles.practiceSection}>
            <TouchableOpacity 
              style={[styles.practiceButton, styles.strengthenButton]}
              onPress={() => navigateToQuestion('strengthen')}
            >
              <Text style={styles.buttonText}>🧠 Strengthen Arguments</Text>
              <Text style={styles.buttonSubtext}>Practice identifying what strengthens an argument</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.practiceButton, styles.weakenButton]}
              onPress={() => navigateToQuestion('weaken')}
            >
              <Text style={styles.buttonText}>🔍 Weaken Arguments</Text>
              <Text style={styles.buttonSubtext}>Find what undermines the reasoning</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.practiceButton, styles.assumptionButton]}
              onPress={() => navigateToQuestion('assumption')}
            >
              <Text style={styles.buttonText}>🎯 Find Assumptions</Text>
              <Text style={styles.buttonSubtext}>Identify unstated premises</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.practiceButton, styles.flawButton]}
              onPress={() => navigateToQuestion('flaw')}
            >
              <Text style={styles.buttonText}>❌ Logical Flaws</Text>
              <Text style={styles.buttonSubtext}>Spot errors in reasoning</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, {color: isDarkMode ? '#fff' : '#333'}]}>
              Your Progress
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Questions Answered</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>0%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>
          </View>

          {/* Review Section */}
          <TouchableOpacity style={styles.reviewButton}>
            <Text style={styles.reviewButtonText}>📚 Review Missed Questions</Text>
            <Text style={styles.reviewSubtext}>Practice questions you got wrong</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
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
  practiceSection: {
    marginBottom: 30,
  },
  practiceButton: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  strengthenButton: {
    backgroundColor: '#2196f3',
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
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
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  reviewButton: {
    backgroundColor: '#4caf50',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  },
});

export default HomeScreen;