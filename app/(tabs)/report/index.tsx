import React, { useState, useEffect } from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { fetchTests, fetchReferences } from '@/src/api';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';

const ReportPage = () => {
  const [testData, setTestData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tests, references] = await Promise.all([
        fetchTests(1),
        fetchReferences()
      ]);

      // Organize tests by type
      const organizedData: any = {};
      tests.forEach((test: any) => {
        if (!organizedData[test.test_name]) {
          organizedData[test.test_name] = {
            values: [],
            dates: [],
            reference: references.find((ref: any) => ref.test_name === test.test_name)
          };
        }
        organizedData[test.test_name].values.push(parseFloat(test.test_values));
        organizedData[test.test_name].dates.push(
          new Date(test.test_date).toLocaleDateString('tr-TR', {
            month: 'short',
            day: 'numeric'
          })
        );
      });

      setTestData(organizedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const getStatusText = (values: number[], reference: any) => {
    if (!reference || values.length === 0) return 'Veri Yok';

    const lastValue = values[values.length - 1];
    if (lastValue < reference.min_value) return 'Düşük';
    if (lastValue > reference.max_value) return 'Yüksek';
    return 'Normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Düşük':
        return 'text-red-500';
      case 'Yüksek':
        return 'text-yellow-500';
      case 'Normal':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <Box className='flex items-center justify-center h-screen'>
        <Text>Yükleniyor...</Text>
      </Box>
    );
  }

  return (
    <ScrollView>
      <Box className='p-4'>
        <Text className='text-2xl font-bold mb-4'>
          Kapsamlı Test Raporu
        </Text>

        {Object.entries(testData).map(([testName, data]: [string, any]) => (
          <Box
            key={testName}
            className='bg-white p-4 rounded-lg mb-4 shadow-md'
          >
            <VStack space="md">
              <HStack className='items-center justify-between'>
                <Text className='text-lg font-semibold'>
                  {testName}
                </Text>
                <Text
                  className={getStatusColor(getStatusText(data.values, data.reference))}
                  bold
                >
                  {getStatusText(data.values, data.reference)}
                </Text>
              </HStack>

              {data.values.length > 1 && (
                <LineChart
                  data={{
                    labels: data.dates,
                    datasets: [{ data: data.values }]
                  }}
                  width={Dimensions.get('window').width - 50}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    }
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              )}

              <Box className='p-4 bg-gray-100 rounded-lg'>
                <Text className='text-sm text-gray-600 mt-2'>
                  Referans Aralığı: {data.reference?.min_value} - {data.reference?.max_value}
                </Text>
                <Text className='text-sm text-gray-600 mt-2'>
                  Son Değer: {data.values[data.values.length - 1]}
                </Text>
                <Text className='text-sm text-gray-600 mt-2'>
                  Ortalama: {(data.values.reduce((a: number, b: number) => a + b, 0) / data.values.length).toFixed(2)}
                </Text>
              </Box>
            </VStack>
          </Box>
        ))}
      </Box>
    </ScrollView>
  );
};

export default ReportPage;
