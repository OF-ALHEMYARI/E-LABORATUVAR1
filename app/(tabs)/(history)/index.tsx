import React, { useState, useEffect } from "react";
import { FlatList, TextInput, ActivityIndicator } from "react-native";
import { fetchTests, searchTests, fetchReferences } from "@/src/api";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [references, setReferences] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const testsData = await fetchTests(1); // بيانات المستخدم الأول
        const referencesData = await fetchReferences();
        setTests(testsData);
        setReferences(referencesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = async (query : any) => {
    setSearchQuery(query);
    setIsLoading(true);
    try {
      if (query.trim() === "") {
        const testsData = await fetchTests(1);
        setTests(testsData);
      } else {
        const searchData = await searchTests(1, query);
        setTests(searchData);
      }
    } catch (error) {
      console.error("Error searching tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getColorForValue = (testName: string, value: string) => {
    const reference: any = references.find(
      (ref: any) => ref.test_name === testName
    );
    if (!reference) return "text-gray-600";

    const numericValue = parseFloat(value);
    if (numericValue < reference.min_value) return "text-red-500"; // نقص
    if (numericValue > reference.max_value) return "text-yellow-500"; // زيادة
    return "text-green-500"; // طبيعي
  };

  const getSymbolForValue = (testName: string, value: string) => {
    const reference: any = references.find(
      (ref: any) => ref.test_name === testName
    );
    if (!reference) return "";

    const numericValue = parseFloat(value);
    if (numericValue < reference.min_value) return "↓"; // نقص
    if (numericValue > reference.max_value) return "↑"; // زيادة
    return "↔"; // طبيعي
  };

  return (
    <Box className="flex gap-4 bg-gray-100 mt-4 p-4">
      {/* شريط البحث */}
      <Input>
        <InputField
          placeholder="Search for tests..."
          value={searchQuery}
          onChangeText={handleSearch}
          className="bg-gray-300 rounded-md px-4 py-2"
        />
      </Input>

      {/* عرض حالة التحميل */}
      {isLoading && (
        <ActivityIndicator size="large" color="#0000ff" className="mt-4" />
      )}

      {/* حالة عدم وجود بيانات */}
      {!isLoading && tests.length === 0 && (
        <Text className="text-center text-gray-500 mt-4">No tests found.</Text>
      )}

      {/* قائمة التحاليل */}
      <FlatList
        data={tests}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <Link href={`/tests/${item.id}`} className="mb-4">
            <HStack className="p-4 bg-white rounded-lg shadow-md justify-between w-full">
              <VStack>
                <Text size="md" className="font-bold">
                  {item.test_name}
                </Text>
                <Text className="text-gray-500">{item.test_date}</Text>
                <Text className="text-gray-400">
                  Reference Range:{" "}
                  {
                    references.find(
                      (ref: any) => ref.test_name === item.test_name
                    )?.min_value
                  }{" "}
                  -{" "}
                  {
                    references.find(
                      (ref: any) => ref.test_name === item.test_name
                    )?.max_value
                  }
                </Text>
              </VStack>
              <VStack className="items-center">
                <Text
                  size="lg"
                  className={getColorForValue(item.test_name, item.test_values)}
                >
                  {item.test_values}{" "}
                  {getSymbolForValue(item.test_name, item.test_values)}
                </Text>
              </VStack>
            </HStack>
          </Link>
        )}
      />
    </Box>
  );
}
