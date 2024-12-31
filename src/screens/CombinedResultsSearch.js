import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Searchbar, DataTable, Text, Button, Divider } from 'react-native-paper';
import { firebaseService } from '../services/firebaseService';

const CombinedResultsSearch = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search for patients and test results
  const handleSearch = async () => {
    setLoading(true);
    try {
      // Search for patients
      const patientsData = await firebaseService.searchPatients(searchQuery);
      setPatients(patientsData);

      // Search for test results
      const resultsData = await firebaseService.searchTestResults(searchQuery);
      setTestResults(resultsData);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search patients or test results"
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchBar}
      />

      {/* Patients Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Patients</Title>
          <Divider style={styles.divider} />
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Patient ID</DataTable.Title>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Date of Birth</DataTable.Title>
              <DataTable.Title>Actions</DataTable.Title>
            </DataTable.Header>

            {patients.map((patient) => (
              <DataTable.Row key={patient.id}>
                <DataTable.Cell>{patient.patientId}</DataTable.Cell>
                <DataTable.Cell>{`${patient.firstName} ${patient.lastName}`}</DataTable.Cell>
                <DataTable.Cell>{patient.dateOfBirth}</DataTable.Cell>
                <DataTable.Cell>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('PatientDetails', { patientId: patient.id })}
                  >
                    View Details
                  </Button>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      {/* Test Results Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Test Results</Title>
          <Divider style={styles.divider} />
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Test ID</DataTable.Title>
              <DataTable.Title>Test Type</DataTable.Title>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title>Actions</DataTable.Title>
            </DataTable.Header>

            {testResults.map((result) => (
              <DataTable.Row key={result.id}>
                <DataTable.Cell>{result.testId}</DataTable.Cell>
                <DataTable.Cell>{result.testType}</DataTable.Cell>
                <DataTable.Cell>{result.date}</DataTable.Cell>
                <DataTable.Cell>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('TestDetails', { testId: result.id })}
                  >
                    View Results
                  </Button>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 10,
  },
});

export default CombinedResultsSearch;
