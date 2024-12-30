import React, { useState, useEffect } from "react";
import { ScrollView, ActivityIndicator } from "react-native";
import { fetchTests, fetchReferences } from "@/src/api";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Link } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Icon } from "@/components/ui/icon";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const [recentTests, setRecentTests] = useState([]);
  const [references, setReferences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    abnormal: 0,
    normal: 0
  });
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role);
    };

    loadUserData();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsData, referencesData] = await Promise.all([
        fetchTests(1),
        fetchReferences()
      ]);

      const recent = testsData.slice(0, 5);
      setRecentTests(recent);
      setReferences(referencesData);

      const abnormalCount = testsData.filter((test: any) => {
        const ref = referencesData.find((r: any) => r.test_name === test.test_name);
        if (!ref) return false;
        const value = parseFloat(test.test_values);
        return value < ref.min_value || value > ref.max_value;
      }).length;

      setStats({
        total: testsData.length,
        abnormal: abnormalCount,
        normal: testsData.length - abnormalCount
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setIsLoading(false);
    }
  };

  const getColorForValue = (testName: string, value: string) => {
    const reference: any = references.find(
      (ref: any) => ref.test_name === testName
    );
    if (!reference) return "text-gray-600";

    const numericValue = parseFloat(value);
    if (numericValue < reference.min_value) return "text-red-500";
    if (numericValue > reference.max_value) return "text-yellow-500";
    return "text-green-500";
  };

  const getSymbolForValue = (testName: string, value: string) => {
    const reference: any = references.find(
      (ref: any) => ref.test_name === testName
    );
    if (!reference) return "";

    const numericValue = parseFloat(value);
    if (numericValue < reference.min_value) return "↓";
    if (numericValue > reference.max_value) return "↑";
    return "↔";
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </Box>
    );
  }

  return (
    <ScrollView>
      <Box className="flex-1 p-4">
        {/* İstatistikler */}
        <Box className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <Text className="text-xl font-bold mb-4">Genel Bakış</Text>
          <HStack className="justify-between">
            <VStack className="items-center">
              <Text className="text-3xl font-bold">{stats.total}</Text>
              <Text className="text-gray-500">Toplam Test</Text>
            </VStack>
            <VStack className="items-center">
              <Text className="text-3xl font-bold text-green-500">{stats.normal}</Text>
              <Text className="text-gray-500">Normal</Text>
            </VStack>
            <VStack className="items-center">
              <Text className="text-3xl font-bold text-red-500">{stats.abnormal}</Text>
              <Text className="text-gray-500">Anormal</Text>
            </VStack>
          </HStack>
        </Box>

        {/* Hızlı Eylemler */}
        <Box className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <Text className="text-xl font-bold mb-4">Hızlı Eylemler</Text>
          <HStack space="md">
            <Link href={"/tests" as any} asChild style={{ flex: 1 }}>
              <Button
                className="flex-1 bg-blue-500 rounded-xl"
                size="lg"
              >
                <Icon as={MaterialIcons}  color="white" size="md" className="mr-2" />
                <ButtonText>Yeni Test</ButtonText>
              </Button>
            </Link>
            <Link href={"/report" as any} asChild style={{ flex: 1 }}>
              <Button
                className="flex-1 bg-green-500 rounded-xl"
                size="lg"
              >
                <Icon as={MaterialIcons} color="white" size="md" className="mr-2" />
                <ButtonText>Kapsamlı Rapor</ButtonText>
              </Button>
            </Link>
            {userRole === 'admin' && (
              <Link href={"/admin/index" as any} asChild style={{ flex: 1 }}>
                <Button
                  className="flex-1 bg-purple-600 rounded-xl"
                  size="lg"
                >
                  <Icon as={MaterialIcons} color="white" size="md" className="mr-2" />
                  <ButtonText>Yönetici Paneli</ButtonText>
                </Button>
              </Link>
            )}
          </HStack>
        </Box>

        {/* Son Testler */}
        <Box className="bg-white rounded-xl shadow-lg p-6">
          <HStack className="justify-between items-center mb-4">
            <Text className="text-xl font-bold">Son Testler</Text>
            <Link href={"/tests" as any} asChild>
              <Button variant="outline" size="sm" className="rounded-xl">
                <ButtonText>Tümünü Gör</ButtonText>
              </Button>
            </Link>
          </HStack>
          
          {recentTests.map((test: any) => (
            <Link key={test.id} href={`/tests/${test.id}`}>
              <Box className="bg-gray-50 rounded-xl p-4 mb-3">
                <HStack className="justify-between items-center">
                  <VStack>
                    <Text className="font-bold text-lg">{test.test_name}</Text>
                    <Text className="text-gray-500">{test.test_date}</Text>
                    <Text className="text-gray-400">
                      Referans Aralığı:{" "}
                      {references.find((ref: any) => ref.test_name === test.test_name)?.min_value} -{" "}
                      {references.find((ref: any) => ref.test_name === test.test_name)?.max_value}
                    </Text>
                  </VStack>
                  <Text
                    className={`text-xl font-bold ${getColorForValue(test.test_name, test.test_values)}`}
                  >
                    {test.test_values} {getSymbolForValue(test.test_name, test.test_values)}
                  </Text>
                </HStack>
              </Box>
            </Link>
          ))}
        </Box>
      </Box>
    </ScrollView>
  );
}
