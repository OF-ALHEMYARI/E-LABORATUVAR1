import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Card, Searchbar, List } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminTestInput = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [testData, setTestData] = useState({
    IgG: '',
    IgA: '',
    IgM: '',
    IgE: '',
    comments: '',
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const testResults = await AsyncStorage.getItem('testResults');
      if (testResults) {
        const results = JSON.parse(testResults);
        const uniquePatients = Array.from(
          new Set(results.map(r => r.patientId))
        ).map(id => {
          const patient = results.find(r => r.patientId === id);
          return {
            patientId: id,
            patientName: patient.patientName,
            age: patient.age,
            gender: patient.gender,
          };
        });
        setPatients(uniquePatients);
        setFilteredPatients(uniquePatients);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load patients');
    }
  };

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    const filtered = patients.filter(
      (patient) =>
        patient.patientName.toLowerCase().includes(query.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPatients(filtered);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
  };

  const validateTestData = () => {
    const values = {
      IgG: parseFloat(testData.IgG),
      IgA: parseFloat(testData.IgA),
      IgM: parseFloat(testData.IgM),
      IgE: parseFloat(testData.IgE),
    };

    for (const [key, value] of Object.entries(values)) {
      if (isNaN(value) || value < 0) {
        Alert.alert('Error', `Invalid ${key} value`);
        return false;
      }
    }

    return true;
  };

  const saveTestResults = async () => {
    try {
      if (!selectedPatient) {
        Alert.alert('Error', 'Please select a patient');
        return;
      }

      if (!validateTestData()) {
        return;
      }

      const newTest = {
        ...selectedPatient,
        ...testData,
        testId: `TEST-${Date.now()}`,
        date: new Date().toISOString(),
      };

      const existingResults = await AsyncStorage.getItem('testResults');
      const results = existingResults ? JSON.parse(existingResults) : [];
      results.push(newTest);

      await AsyncStorage.setItem('testResults', JSON.stringify(results));
      Alert.alert(
        'Success',
        'Test results saved successfully',
        [
          { text: 'View Results', onPress: () => navigation.navigate('TestResults') },
          { text: 'New Test', onPress: () => resetForm() },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save test results');
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setTestData({
      IgG: '',
      IgA: '',
      IgM: '',
      IgE: '',
      comments: '',
    });
  };

  return (
    <ScrollView style={styles.container}>
      {!selectedPatient ? (
        <View>
          <Searchbar
            placeholder="Search patients by name or ID"
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
          <Card style={styles.card}>
            <Card.Content>
              <List.Section>
                {filteredPatients.map((patient, index) => (
                  <List.Item
                    key={index}
                    title={patient.patientName}
                    description={`ID: ${patient.patientId} | Age: ${patient.age} | Gender: ${patient.gender}`}
                    onPress={() => selectPatient(patient)}
                    left={props => <List.Icon {...props} icon="account" />}
                  />
                ))}
              </List.Section>
            </Card.Content>
          </Card>
        </View>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.patientInfo}>
              Patient: {selectedPatient.patientName}
            </Text>
            <Text style={styles.patientInfo}>
              ID: {selectedPatient.patientId} | Age: {selectedPatient.age} | Gender: {selectedPatient.gender}
            </Text>

            <TextInput
              label="IgG (mg/dL)"
              value={testData.IgG}
              onChangeText={(value) => setTestData({ ...testData, IgG: value })}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="IgA (mg/dL)"
              value={testData.IgA}
              onChangeText={(value) => setTestData({ ...testData, IgA: value })}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="IgM (mg/dL)"
              value={testData.IgM}
              onChangeText={(value) => setTestData({ ...testData, IgM: value })}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="IgE"
              value={testData.IgE}
              onChangeText={(value) => setTestData({ ...testData, IgE: value })}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Comments"
              value={testData.comments}
              onChangeText={(value) => setTestData({ ...testData, comments: value })}
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <Button mode="contained" onPress={saveTestResults} style={styles.button}>
              Save Test Results
            </Button>

            <Button
              mode="outlined"
              onPress={() => setSelectedPatient(null)}
              style={styles.button}
            >
              Select Different Patient
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchBar: {
    marginBottom: 10,
  },
  card: {
    marginBottom: 10,
  },
  patientInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
});

export default AdminTestInput;
