import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { MaterialIcons } from '@expo/vector-icons';
import { Icon } from '@/components/ui/icon';
import { Link } from 'expo-router';

const AdminDashboard = () => {
  return (
    <ScrollView>
      <Box className="p-6">
        <Text className="text-2xl font-bold mb-6">Yönetici Paneli</Text>

        <VStack space="lg">
          {/* Kılavuz Yönetimi */}
          <Box className="bg-white p-6 rounded-xl shadow-md">
            <HStack className="items-center mb-4">
              <Icon as={MaterialIcons} name="book" size="xl" color="primary" />
              <Text className="text-xl font-semibold ml-2">Kılavuz Yönetimi</Text>
            </HStack>
            <Text className="text-gray-600 mb-4">
              Referans değerleri ve yaş gruplarını yönetin
            </Text>
            <Link href="/admin/guides" asChild>
              <Button className="bg-blue-500">
                <ButtonText>Kılavuzları Yönet</ButtonText>
              </Button>
            </Link>
          </Box>

          {/* Hasta Yönetimi */}
          <Box className="bg-white p-6 rounded-xl shadow-md">
            <HStack className="items-center mb-4">
              <Icon as={MaterialIcons} name="people" size="xl" color="primary" />
              <Text className="text-xl font-semibold ml-2">Hasta Yönetimi</Text>
            </HStack>
            <Text className="text-gray-600 mb-4">
              Hasta bilgilerini ve test sonuçlarını yönetin
            </Text>
            <Link href="/admin/patients" asChild>
              <Button className="bg-green-500">
                <ButtonText>Hastaları Yönet</ButtonText>
              </Button>
            </Link>
          </Box>

          {/* Test Sonuçları */}
          <Box className="bg-white p-6 rounded-xl shadow-md">
            <HStack className="items-center mb-4">
              <Icon as={MaterialIcons} name="science" size="xl" color="primary" />
              <Text className="text-xl font-semibold ml-2">Test Sonuçları</Text>
            </HStack>
            <Text className="text-gray-600 mb-4">
              Test sonuçlarını görüntüleyin ve analiz edin
            </Text>
            <Link href="/admin/tests" asChild>
              <Button className="bg-purple-500">
                <ButtonText>Test Sonuçlarını Görüntüle</ButtonText>
              </Button>
            </Link>
          </Box>

          {/* Veri Analizi */}
          <Box className="bg-white p-6 rounded-xl shadow-md">
            <HStack className="items-center mb-4">
              <Icon as={MaterialIcons} name="analytics" size="xl" color="primary" />
              <Text className="text-xl font-semibold ml-2">Veri Analizi</Text>
            </HStack>
            <Text className="text-gray-600 mb-4">
              Test sonuçlarını analiz edin ve raporlar oluşturun
            </Text>
            <Link href="/admin/analysis" asChild>
              <Button className="bg-orange-500">
                <ButtonText>Analiz Yap</ButtonText>
              </Button>
            </Link>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default AdminDashboard;
