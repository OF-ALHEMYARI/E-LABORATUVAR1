import React, { useState, useEffect } from "react";
import { fetchTests, fetchReferences } from "@/src/api";
import { useLocalSearchParams } from "expo-router";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";

export default function TestDetails() {
  const { id } = useLocalSearchParams();
  const [test, setTest] = useState<any>(null);
  const [references, setReferences] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const testsData = await fetchTests(1); // جلب بيانات المستخدم
      const testDetails = testsData.find((t : any) => t.id === parseInt(id as string));
      setTest(testDetails);

      const referencesData = await fetchReferences();
      setReferences(referencesData);
    };

    loadData();
  }, [id]);

  const getReferenceRange = (testName: string) => {
    const reference : any = references.find((ref : any) => ref.test_name === testName);
    return reference
      ? `${reference.min_value} - ${reference.max_value}`
      : "N/A";
  };

  const getStatus = (testName: string, value: string) => {
    const reference : any = references.find((ref : any) => ref.test_name === testName);
    if (!reference) return "Unknown";

    const numericValue = parseFloat(value);
    if (numericValue < reference.min_value) return "Low ↓";
    if (numericValue > reference.max_value) return "High ↑";
    return "Normal ↔";
  };

  return (
    <Box className="flex p-4 bg-gray-300 rounded-md shadow-md">
      <VStack space="lg">
        <Text size="xl" bold>
          {test?.test_name}
        </Text>
        <Text size="md" className="text-gray-600">
          Test Date: {test?.test_date}
        </Text>
        <HStack className="items-center justify-between">
          <Text size="lg" bold>
            Current Value:
          </Text>
          <Text size="lg" className="text-blue-500">
            {test?.test_values} ({getStatus(test?.test_name, test?.test_values)}
            )
          </Text>
        </HStack>
        <HStack className="items-center justify-between">
          <Text size="lg" bold>
            Reference Range:
          </Text>
          <Text size="lg" className="text-green-500">
            {getReferenceRange(test?.test_name)}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}
