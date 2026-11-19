export const RUNOFF_COEFFICIENT = 0.9;

export const REPORT_IMPACT_ASSUMPTIONS = {
  familySize: 4,
  litresPerPersonPerDay: 75,
  litresPerTreePerYear: 365,
  tankerCapacityLitres: 5_000,
  litresPerChildPerSchoolDay: 5,
  schoolDaysPerYear: 200,
} as const;
