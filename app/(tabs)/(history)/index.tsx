import React, { useState, useEffect } from "react";
import { FlatList, ActivityIndicator, Dimensions } from "react-native";
import { fetchTests, searchTests, fetchReferences } from "@/src/api";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Select, SelectTrigger, SelectInput, SelectPortal, SelectItem } from "@/components/ui/select";
import { Link } from "expo-router";
import { LineChart } from "react-native-chart-kit";

const TEST_TYPES = ["All", "IgA", "IgM", "IgG", "IgG1", "IgG2", "IgG3", "IgG4"];

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [references, setReferences] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [testsData, referencesData] = await Promise.all([
        fetchTests(1),
        fetchReferences()
      ]);
      setTests(testsData);
      setReferences(referencesData);
      updateChartData(testsData, "All");
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    try {
      let filteredTests;
      if (query.trim() === "") {
        filteredTests = await fetchTests(1);
      } else {
        filteredTests = await searchTests(1, query);
      }
      
      // تطبيق فلتر نوع التحليل
      if (selectedType !== "All") {
        filteredTests = filteredTests.filter((test: any) => 
          test.test_name === selectedType
        );
      }
      
      setTests(filteredTests);
      updateChartData(filteredTests, selectedType);
    } catch (error) {
      console.error("Error searching tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = async (type: string) => {
    setSelectedType(type);
    setIsLoading(true);
    try {
      let filteredTests = await fetchTests(1);
      
      // تطبيق فلتر البحث
      if (searchQuery) {
        filteredTests = filteredTests.filter((test: any) =>
          test.test_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // تطبيق فلتر نوع التحليل
      if (type !== "All") {
        filteredTests = filteredTests.filter((test: any) => 
          test.test_name === type
        );
      }
      
      setTests(filteredTests);
      updateChartData(filteredTests, type);
    } catch (error) {
      console.error("Error filtering tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChartData = (testsData: any[], type: string) => {
    if (type === "All" || testsData.length === 0) {
      setChartData(null);
      return;
    }

    const filteredTests = testsData
      .filter(test => test.test_name === type)
      .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());

    if (filteredTests.length > 0) {
      setChartData({
        labels: filteredTests.map(test => 
          new Date(test.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ),
        datasets: [{
          data: filteredTests.map(test => parseFloat(test.test_values))
        }]
      });
    }
  };

  const getColorForValue = (testName: string, value: string) => {
    const reference = references.find(
      (ref: any) => ref.test_name === testName
    );
    if (!reference) return "text-gray-600";

    const numericValue = parseFloat(value);
    if (numericValue < reference.min_value) return "text-red-500";
    if (numericValue > reference.max_value) return "text-yellow-500";
    return "text-green-500";
  };

  const getSymbolForValue = (testName: string, value: string) => {
    const reference = references.find(
      (ref: any) => ref.test_name === testName
    );
    if (!reference) return "";

    const numericValue = parseFloat(value);
    if (numericValue < reference.min_value) return "↓";
    if (numericValue > reference.max_value) return "↑";
    return "↔";
  };

  return (
    <Box className="flex-1 bg-gray-100">
      <Box className="p-4">
        {/* فلترة وبحث */}
        <VStack space="md">
          <Input>
            <InputField
              placeholder="Search for tests..."
              value={searchQuery}
              onChangeText={handleSearch}
              className="bg-white rounded-md px-4 py-2"
            />
          </Input>

          <Select
            selectedValue={selectedType}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger>
              <SelectInput placeholder="Select test type" />
            </SelectTrigger>
            <SelectPortal>
              {TEST_TYPES.map((type) => (
                <SelectItem key={type} label={type} value={type} />
              ))}
            </SelectPortal>
          </Select>
        </VStack>

        {/* الرسم البياني */}
        {chartData && (
          <Box className="mt-4 bg-white p-4 rounded-lg">
            <Text className="text-lg font-bold mb-2">Results Trend</Text>
            <LineChart
              data={chartData}
              width={Dimensions.get("window").width - 40}
              height={220}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </Box>
        )}

        {/* حالة التحميل */}
        {isLoading && (
          <ActivityIndicator size="large" color="#0000ff" className="mt-4" />
        )}

        {/* قائمة التحاليل */}
        <FlatList
          data={tests}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }) => (
            <Link href={`/tests/${item.id}`} className="mb-4">
              <Box className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <HStack className="justify-between">
                  <VStack>
                    <Text className="font-bold">{item.test_name}</Text>
                    <Text className="text-gray-500">{item.test_date}</Text>
                    <Text className="text-gray-400">
                      Reference Range:{" "}
                      {references.find((ref: any) => ref.test_name === item.test_name)?.min_value} -{" "}
                      {references.find((ref: any) => ref.test_name === item.test_name)?.max_value}
                    </Text>
                  </VStack>
                  <VStack className="items-end">
                    <Text
                      className={`text-lg ${getColorForValue(item.test_name, item.test_values)}`}
                    >
                      {item.test_values} {getSymbolForValue(item.test_name, item.test_values)}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </Link>
          )}
          ListEmptyComponent={() => (
            <Text className="text-center text-gray-500 mt-4">
              No tests found.
            </Text>
          )}
        />
      </Box>
    </Box>
  );
}
