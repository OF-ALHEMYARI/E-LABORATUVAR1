import { getReferenceRange } from '../constants/referenceRanges';

export const analyzeTestResults = (currentTest, previousTests = []) => {
  const referenceRange = getReferenceRange(currentTest.patientAge);
  const analysis = {
    summary: [],
    abnormalValues: [],
    trends: [],
    recommendations: []
  };

  // Analyze each immunoglobulin
  Object.entries(currentTest.results).forEach(([type, value]) => {
    const range = referenceRange[type];
    
    // Check if value is outside reference range
    if (type === 'IgE') {
      if (value > range.max) {
        analysis.abnormalValues.push(`${type} is elevated (${value})`);
        analysis.summary.push(`Elevated ${type} levels may indicate allergic response or parasitic infection`);
      }
    } else {
      if (value < range.min) {
        analysis.abnormalValues.push(`${type} is low (${value})`);
        analysis.summary.push(`Low ${type} levels may indicate immune deficiency`);
      } else if (value > range.max) {
        analysis.abnormalValues.push(`${type} is high (${value})`);
        analysis.summary.push(`High ${type} levels may indicate infection or autoimmune condition`);
      }
    }

    // Analyze trends if previous tests exist
    if (previousTests.length > 0) {
      const previousTest = previousTests[0];
      const previousValue = previousTest.results[type];
      const percentChange = ((value - previousValue) / previousValue) * 100;

      if (Math.abs(percentChange) >= 20) {
        analysis.trends.push(
          `${type} has ${percentChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange.toFixed(1))}% since last test`
        );
      }
    }
  });

  // Generate recommendations based on analysis
  if (analysis.abnormalValues.length > 0) {
    analysis.recommendations.push('Consider follow-up testing to confirm results');
    analysis.recommendations.push('Review patient history for recent infections or changes');
  }

  if (analysis.trends.some(trend => trend.includes('increased'))) {
    analysis.recommendations.push('Monitor for symptoms of infection or inflammation');
  }

  if (analysis.trends.some(trend => trend.includes('decreased'))) {
    analysis.recommendations.push('Evaluate for possible immunodeficiency');
  }

  return analysis;
};

export const generateClinicalReport = (test, previousTests = []) => {
  const analysis = analyzeTestResults(test, previousTests);
  const referenceRange = getReferenceRange(test.patientAge);

  let report = `Clinical Immunology Report\n`;
  report += `Date: ${new Date(test.date).toLocaleDateString()}\n`;
  report += `Patient Age: ${test.patientAge} years\n\n`;

  report += `Test Results:\n`;
  Object.entries(test.results).forEach(([type, value]) => {
    const range = referenceRange[type];
    report += `${type}: ${value} (Reference: ${type === 'IgE' ? `≤${range.max}` : `${range.min}-${range.max}`})\n`;
  });

  if (analysis.abnormalValues.length > 0) {
    report += `\nAbnormal Values:\n`;
    analysis.abnormalValues.forEach(value => {
      report += `- ${value}\n`;
    });
  }

  if (analysis.trends.length > 0) {
    report += `\nTrends:\n`;
    analysis.trends.forEach(trend => {
      report += `- ${trend}\n`;
    });
  }

  report += `\nClinical Interpretation:\n`;
  analysis.summary.forEach(summary => {
    report += `- ${summary}\n`;
  });

  report += `\nRecommendations:\n`;
  analysis.recommendations.forEach(recommendation => {
    report += `- ${recommendation}\n`;
  });

  return report;
};
