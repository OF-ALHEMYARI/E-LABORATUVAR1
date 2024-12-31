import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Card, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminMenu = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('currentUser');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Reference Management</Text>
          <Text style={styles.description}>
            Manage age-specific reference ranges for immunoglobulin tests.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AdminReferenceGuides')}
            style={styles.button}
            icon="book-open-variant"
          >
            Manage Reference Guides
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Test Results Management</Text>
          <Text style={styles.description}>
            Input and manage patient test results with automatic validation.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AdminTestInput')}
            style={styles.button}
            icon="database-plus"
          >
            Input Test Results
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Patient Analysis</Text>
          <Text style={styles.description}>
            Search patients and analyze immunoglobulin trends over time.
            View color-coded changes (↑↓↔) with percentage differences.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('PatientSearch')}
            style={styles.button}
            icon="trending-up"
          >
            Patient Trends Analysis
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Test Results Overview</Text>
          <Text style={styles.description}>
            View comprehensive test results for all patients.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('TestResults')}
            style={styles.button}
            icon="chart-line"
          >
            View All Test Results
          </Button>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={[styles.button, styles.logoutButton]}
        icon="logout"
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2196F3',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default AdminMenu;
