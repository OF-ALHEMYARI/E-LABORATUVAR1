import React from 'react';
import { ScrollView } from 'react-native';
import { Button, ButtonText } from "@/components/ui/button";
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';

const TestsPage = () => {
  const testTypes = [
    { id: 1, name: 'IgA Testi', description: 'Bağışıklık sistemi antikor seviyesi ölçümü' },
    { id: 2, name: 'IgM Testi', description: 'Akut enfeksiyon göstergesi antikor ölçümü' },
    { id: 3, name: 'IgG Testi', description: 'Uzun süreli bağışıklık antikor ölçümü' },
    { id: 4, name: 'IgG1 Alt Sınıfı', description: 'Spesifik IgG antikor alt türü ölçümü' },
    { id: 5, name: 'IgG2 Alt Sınıfı', description: 'Spesifik IgG antikor alt türü ölçümü' },
    { id: 6, name: 'IgG3 Alt Sınıfı', description: 'Spesifik IgG antikor alt türü ölçümü' },
    { id: 7, name: 'IgG4 Alt Sınıfı', description: 'Spesifik IgG antikor alt türü ölçümü' },
  ];

  return (
    <ScrollView>
      <Box className='p-4 bg-white'>
        <Text className='text-2xl font-bold mb-4'>
          Test Türleri
        </Text>
        <VStack space="md">
          {testTypes.map((test) => (
            <Box
              key={test.id}
              className='p-4 bg-gray-100 rounded-lg shadow-sm'
            >
              <HStack className='justify-between '>
                <VStack className='flex-1'>
                  <Text className='text-lg font-semibold mb-2'>
                    {test.name}
                  </Text>
                  <Text className='text-gray-600'>
                    {test.description}
                  </Text>
                </VStack>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {/* TODO: Navigate to test detail */}}
                >
                  <ButtonText>Detaylar</ButtonText>
                </Button>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default TestsPage;
