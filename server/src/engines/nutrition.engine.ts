import { ParsedRoute } from '../types/route.types';
import { RiderSettings } from '../types/rider.types';
import { PacingResult, NutritionResult, HourlyNutrition } from '../types/analysis.types';

/** Carb target based on continuous FTP % intensity */
function carbTargetFromIntensity(ftpPct: number): number {
  if (ftpPct <= 63) return 60;  // Casual
  if (ftpPct <= 75) return 75;  // Endurance
  if (ftpPct <= 83) return 85;  // Tempo
  return 90;                     // Race
}

const FLUID_PER_HOUR_ML = 625;
const SODIUM_PER_HOUR_MG = 600;

// Food items (carb content in grams)
const GEL_CARBS = 22;
const BAR_CARBS = 42;
const BOTTLE_CARBS = 30; // carb mix bottle

function buildFoodSuggestions(carbsNeeded: number): string[] {
  const suggestions: string[] = [];
  let remaining = carbsNeeded;

  // Greedy fill: bottles first, then bars, then gels
  const bottles = Math.floor(remaining / BOTTLE_CARBS);
  if (bottles > 0) {
    suggestions.push(`${bottles}x carb mix bottle${bottles > 1 ? 's' : ''} (~${bottles * BOTTLE_CARBS}g carbs)`);
    remaining -= bottles * BOTTLE_CARBS;
  }

  const bars = Math.floor(remaining / BAR_CARBS);
  if (bars > 0) {
    suggestions.push(`${bars}x energy bar${bars > 1 ? 's' : ''} (~${bars * BAR_CARBS}g carbs)`);
    remaining -= bars * BAR_CARBS;
  }

  const gels = Math.ceil(remaining / GEL_CARBS);
  if (gels > 0) {
    suggestions.push(`${gels}x gel${gels > 1 ? 's' : ''} (~${gels * GEL_CARBS}g carbs)`);
  }

  return suggestions;
}

export function runNutritionEngine(
  route: ParsedRoute,
  rider: RiderSettings,
  pacing: PacingResult
): NutritionResult {
  const durationHours = pacing.estimatedTotalTimeMin / 60;
  const avgPowerW = pacing.normalizedPowerW;
  const carbsPerHour = carbTargetFromIntensity(rider.intensity);

  // Total kcal: avgPower × 3.6 × duration (kJ ≈ kcal for cycling efficiency ~25%)
  const totalKcal = Math.round(avgPowerW * 3.6 * durationHours);
  const totalCarbsG = Math.round(carbsPerHour * durationHours);
  const totalFluidMl = Math.round(FLUID_PER_HOUR_ML * durationHours);
  const totalSodiumMg = Math.round(SODIUM_PER_HOUR_MG * durationHours);

  // Build hourly plan
  const hourlyPlan: HourlyNutrition[] = [];
  const fullHours = Math.floor(durationHours);
  const fractionalHour = durationHours - fullHours;

  for (let h = 0; h < fullHours; h++) {
    const suggestions = buildFoodSuggestions(carbsPerHour);
    hourlyPlan.push({
      hour: h + 1,
      carbsG: carbsPerHour,
      fluidMl: FLUID_PER_HOUR_ML,
      sodiumMg: SODIUM_PER_HOUR_MG,
      suggestions,
    });
  }

  // Partial last hour
  if (fractionalHour > 0.1) {
    const partialCarbs = Math.round(carbsPerHour * fractionalHour);
    hourlyPlan.push({
      hour: fullHours + 1,
      carbsG: partialCarbs,
      fluidMl: Math.round(FLUID_PER_HOUR_ML * fractionalHour),
      sodiumMg: Math.round(SODIUM_PER_HOUR_MG * fractionalHour),
      suggestions: buildFoodSuggestions(partialCarbs),
    });
  }

  return {
    totalKcal,
    totalCarbsG,
    totalFluidMl,
    totalSodiumMg,
    carbsPerHour,
    fluidPerHourMl: FLUID_PER_HOUR_ML,
    sodiumPerHourMg: SODIUM_PER_HOUR_MG,
    hourlyPlan,
    estimatedDurationHours: Math.round(durationHours * 10) / 10,
  };
}
