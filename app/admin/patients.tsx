import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { MaterialIcons } from '@expo/vector-icons';
import { Icon } from '@/components/ui/icon';
import { Select, SelectTrigger, SelectInput, SelectPortal, SelectItem } from '@/components/ui/select';

const PatientsManagement = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientTests, setPatientTests] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://192.168.1.105:3000/admin/patients/search?query=${searchQuery}`);
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patientId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://192.168.1.105:3000/admin/patients/${patientId}/tests`);
      const data = await response.json();
      setSelectedPatient(patients.find(p => p.id === patientId));
      setPatientTests(data);
    } catch (error) {
      console.error('Error fetching patient tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTestTrend = (currentValue, previousValue) => {
    if (!previousValue) return '↔';
    const current = parseFloat(currentValue);
    const previous = parseFloat(previousValue);
    if (current > previous) return '↑';
    if (current < previous) return '↓';
    return '↔';
  };

  const getTestColor = (trend) => {
    switch (trend) {
      case '↑':
        return 'text-yellow-500';
      case '↓':
        return 'text-red-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <ScrollView>
      <Box className="p-6">
        <Text className="text-2xl font-bold mb-6">Hasta Yönetimi</Text>

        {/* Arama Bölümü */}
        <Box className="bg-white p-4 rounded-xl shadow-md mb-6">
          <VStack space="md">
            <Input>
              <InputField
                placeholder="Hasta adı veya soyadı ile ara..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
            <Button onPress={handleSearch} className="bg-blue-500">
              <Icon as={MaterialIcons} name="search" color="white" size="sm" className="mr-2" />
              <ButtonText>Ara</ButtonText>
            </Button>
          </VStack>
        </Box>

        {loading && (
          <ActivityIndicator size="large" color="#0891b2" />
        )}

        {/* Hasta Listesi */}
        {patients.length > 0 && (
          <Box className="bg-white p-4 rounded-xl shadow-md mb-6">
            <Text className="text-xl font-semibold mb-4">Bulunan Hastalar</Text>
            <VStack space="md">
              {patients.map((patient) => (
                <Button
                  key={patient.id}
                  variant={selectedPatient?.id === patient.id ? 'solid' : 'outline'}
                  onPress={() => handlePatientSelect(patient.id)}
                  className="w-full"
                >
                  <HStack className="justify-between items-center w-full">
                    <Text>{patient.name} {patient.surname}</Text>
                    <Text className="text-gray-500">Yaş: {patient.age}</Text>
                  </HStack>
                </Button>
              ))}
            </VStack>
          </Box>
        )}

        {/* Test Sonuçları */}
        {selectedPatient && patientTests.length > 0 && (
          <Box className="bg-white p-4 rounded-xl shadow-md">
            <Text className="text-xl font-semibold mb-4">
              {selectedPatient.name} {selectedPatient.surname} - Test Sonuçları
            </Text>
            <VStack space="md">
              {patientTests.map((test, index) => {
                const previousTest = patientTests[index + 1];
                const trend = getTestTrend(test.test_values, previousTest?.test_values);
                return (
                  <Box
                    key={test.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <HStack className="justify-between items-center">
                      <VStack>
                        <Text className="font-semibold">{test.test_name}</Text>
                        <Text className="text-gray-500">{test.test_date}</Text>
                      </VStack>
                      <HStack space="sm" className="items-center">
                        <Text className={`text-lg font-bold ${getTestColor(trend)}`}>
                          {test.test_values}
                        </Text>
                        <Text className={`text-lg ${getTestColor(trend)}`}>
                          {trend}
                        </Text>
                      </HStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        )}
      </Box>
    </ScrollView>
  );
};

export default PatientsManagement;
