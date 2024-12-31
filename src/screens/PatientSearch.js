import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Searchbar, Card, Title, Paragraph, DataTable, Button, Text, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PatientSearch = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [testHistory, setTestHistory] = useState([]);

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
      console.error('Error loading patients:', error);
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

  const loadPatientHistory = async (patient) => {
    try {
      const testResults = await AsyncStorage.getItem('testResults');
      if (testResults) {
        const results = JSON.parse(testResults);
        const patientTests = results.filter(
          test => test.patientId === patient.patientId
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
        setTestHistory(patientTests);
        setSelectedPatient(patient);
      }
    } catch (error) {
      console.error('Error loading patient history:', error);
    }
  };

  const calculateTrends = () => {
    if (testHistory.length < 2) return null;

    const trends = {
      IgG: [],
      IgA: [],
      IgM: [],
      IgE: []
    };

    for (let i = 1; i < testHistory.length; i++) {
      const current = testHistory[i];
      const previous = testHistory[i - 1];
      
      Object.keys(trends).forEach(key => {
        const currentVal = parseFloat(current[key]);
        const previousVal = parseFloat(previous[key]);
        const diff = currentVal - previousVal;
        const percentChange = ((diff / previousVal) * 100).toFixed(1);
        const trend = diff > 0 ? '↑' : diff < 0 ? '↓' : '↔';
        const color = diff > 0 ? '#4CAF50' : diff < 0 ? '#F44336' : '#757575';
        trends[key].push({
          trend,
          color,
          percentChange: diff === 0 ? '' : `${percentChange}%`
        });
      });
    }

    return trends;
  };

  const renderTrendCell = (value, trendInfo) => {
    if (!trendInfo) return <Text>{value}</Text>;
    
    return (
      <View style={styles.trendContainer}>
        <Text>{value}</Text>
        <View style={styles.trendInfo}>
          <Text style={{ color: trendInfo.color, marginRight: 4 }}>
            {trendInfo.trend}
          </Text>
          <Text style={{ color: trendInfo.color, fontSize: 12 }}>
            {trendInfo.percentChange}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Searchbar
        placeholder="Search patients by name or ID"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      {selectedPatient ? (
        <View>
          <Card style={styles.patientCard}>
            <Card.Content>
              <Title>{selectedPatient.patientName}</Title>
              <Paragraph>ID: {selectedPatient.patientId}</Paragraph>
              <Paragraph>Age: {selectedPatient.age}</Paragraph>
              <Paragraph>Gender: {selectedPatient.gender}</Paragraph>
              <Button
                mode="outlined"
                onPress={() => setSelectedPatient(null)}
                style={styles.button}
              >
                Back to Search
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.historyCard}>
            <Card.Content>
              <Title>Test History and Trends</Title>
              <Paragraph style={styles.legend}>
                Trend Indicators: ↑ Increase, ↓ Decrease, ↔ No Change
              </Paragraph>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Date</DataTable.Title>
                  <DataTable.Title numeric>IgG</DataTable.Title>
                  <DataTable.Title numeric>IgA</DataTable.Title>
                  <DataTable.Title numeric>IgM</DataTable.Title>
                  <DataTable.Title numeric>IgE</DataTable.Title>
                </DataTable.Header>

                {testHistory.map((test, index) => {
                  const trends = calculateTrends();
                  return (
                    <DataTable.Row key={index}>
                      <DataTable.Cell>
                        {new Date(test.date).toLocaleDateString()}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {renderTrendCell(test.IgG, trends && index > 0 ? trends.IgG[index - 1] : null)}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {renderTrendCell(test.IgA, trends && index > 0 ? trends.IgA[index - 1] : null)}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {renderTrendCell(test.IgM, trends && index > 0 ? trends.IgM[index - 1] : null)}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {renderTrendCell(test.IgE, trends && index > 0 ? trends.IgE[index - 1] : null)}
                      </DataTable.Cell>
                    </DataTable.Row>
                  );
                })}
              </DataTable>
            </Card.Content>
          </Card>
        </View>
      ) : (
        <View>
          {filteredPatients.map((patient, index) => (
            <Card
              key={index}
              style={styles.card}
              onPress={() => loadPatientHistory(patient)}
            >
              <Card.Content>
                <Title>{patient.patientName}</Title>
                <Paragraph>ID: {patient.patientId}</Paragraph>
                <Paragraph>Age: {patient.age} | Gender: {patient.gender}</Paragraph>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    marginBottom: 10,
  },
  card: {
    marginBottom: 10,
  },
  patientCard: {
    marginBottom: 10,
    backgroundColor: '#e3f2fd',
  },
  historyCard: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  legend: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
});

export default PatientSearch;
