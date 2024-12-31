// Reference ranges from Turkish Medical Science and Turkish Journal of Pediatrics
export const IMMUNOGLOBULIN_UNITS = {
  IgG: 'mg/dL',
  IgA: 'mg/dL',
  IgM: 'mg/dL',
  IgE: 'IU/mL'
};

export const AGE_GROUPS = {
  NEWBORN: '0-1 month',
  INFANT_EARLY: '1-4 months',
  INFANT_LATE: '4-12 months',
  TODDLER: '1-5 years',
  CHILD: '6-10 years',
  ADOLESCENT: '11-16 years',
  ADULT: 'Adult'
};

export const DEFAULT_REFERENCE_RANGES = [
  {
    ageGroup: AGE_GROUPS.NEWBORN,
    description: 'Newborn Period',
    IgG: { min: 700, max: 1600 },
    IgA: { min: 0, max: 80 },
    IgM: { min: 20, max: 120 },
    IgE: { max: 1.5 },
    source: 'Turkish Journal of Pediatrics',
    citation: 'Vol. 63, 2021',
    notes: 'Values may be influenced by maternal antibodies'
  },
  {
    ageGroup: AGE_GROUPS.INFANT_EARLY,
    description: 'Early Infancy',
    IgG: { min: 200, max: 1200 },
    IgA: { min: 10, max: 100 },
    IgM: { min: 30, max: 120 },
    IgE: { max: 15 },
    source: 'Turkish Journal of Pediatrics',
    citation: 'Vol. 63, 2021',
    notes: 'Physiological hypogammaglobulinemia period'
  },
  {
    ageGroup: AGE_GROUPS.INFANT_LATE,
    description: 'Late Infancy',
    IgG: { min: 300, max: 1500 },
    IgA: { min: 20, max: 150 },
    IgM: { min: 50, max: 200 },
    IgE: { max: 30 },
    source: 'Turk Med Sci',
    citation: '51(2021)',
    notes: 'Beginning of own antibody production'
  },
  {
    ageGroup: AGE_GROUPS.TODDLER,
    description: 'Toddler and Preschool',
    IgG: { min: 400, max: 1600 },
    IgA: { min: 30, max: 200 },
    IgM: { min: 50, max: 250 },
    IgE: { max: 60 },
    source: 'Turk Med Sci',
    citation: '51(2021)',
    notes: 'Rapid increase in immunoglobulin levels'
  },
  {
    ageGroup: AGE_GROUPS.CHILD,
    description: 'School Age',
    IgG: { min: 600, max: 1800 },
    IgA: { min: 50, max: 300 },
    IgM: { min: 50, max: 300 },
    IgE: { max: 90 },
    source: 'Turkish Journal of Pediatrics',
    citation: 'Vol. 63, 2021',
    notes: 'Values approaching adult levels'
  },
  {
    ageGroup: AGE_GROUPS.ADOLESCENT,
    description: 'Adolescence',
    IgG: { min: 700, max: 1900 },
    IgA: { min: 70, max: 350 },
    IgM: { min: 60, max: 350 },
    IgE: { max: 200 },
    source: 'Turk Med Sci',
    citation: '51(2021)',
    notes: 'Adult levels established'
  },
  {
    ageGroup: AGE_GROUPS.ADULT,
    description: 'Adult Reference',
    IgG: { min: 700, max: 1600 },
    IgA: { min: 70, max: 400 },
    IgM: { min: 40, max: 230 },
    IgE: { max: 100 },
    source: 'Turkish Journal of Pediatrics',
    citation: 'Vol. 63, 2021',
    notes: 'Standard adult reference range'
  }
];

export const getAgeGroup = (ageInYears) => {
  if (ageInYears < 1/12) return AGE_GROUPS.NEWBORN;
  if (ageInYears < 4/12) return AGE_GROUPS.INFANT_EARLY;
  if (ageInYears < 1) return AGE_GROUPS.INFANT_LATE;
  if (ageInYears < 6) return AGE_GROUPS.TODDLER;
  if (ageInYears < 11) return AGE_GROUPS.CHILD;
  if (ageInYears < 17) return AGE_GROUPS.ADOLESCENT;
  return AGE_GROUPS.ADULT;
};

export const getReferenceRange = (ageInYears) => {
  const ageGroup = getAgeGroup(ageInYears);
  return DEFAULT_REFERENCE_RANGES.find(range => range.ageGroup === ageGroup);
};

export const formatValue = (value, unit) => {
  return `${value} ${unit}`;
};
