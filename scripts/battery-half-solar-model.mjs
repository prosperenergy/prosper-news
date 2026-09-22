// Reproducible scenario, not a forecast, installation quote, or generation-equivalence model.
// Run: node scripts/battery-half-solar-model.mjs
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sources = {
  residentialBaseline: 'https://seia.org/research-resources/6-million-solar-installations/',
  installedPrice: 'https://www.energysage.com/energy-storage/how-much-do-batteries-cost/',
  darlington: 'https://www.opg.com/projects-services/projects/nuclear/smr/darlington-smr/',
  exchangeRate: 'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?start_date=2026-09-11&end_date=2026-09-11',
};
const assumptions = {
  scope: 'United States; residential installations are a rounded proxy for solar homes',
  checkedDate: '2026-09-13',
  totalSolarInstallationsMilestone: 6_000_000,
  residentialShare: 0.97,
  incrementalBatteryAdoptionShare: 0.5,
  newBatteryUsableKWhPerSelectedHome: 13.5,
  typicalInstalledBenchmarkUSD: 15_647,
  priceSensitivityUSD: [13_055, 15_647, 20_000],
  priceSensitivityBasis: ['Published brand-specific installed-price example', 'Published typical installed-price benchmark', 'Assumed higher-cost case, not a published market percentile'],
  darlingtonFourUnitBudgetCAD: 20_900_000_000,
  exchangeRateCADPerUSD: 1.3866,
  exchangeRateDate: '2026-09-11',
  dispatchDurationHours: 4,
  reserveEnergyFraction: 0.2,
  availableFleetFraction: 0.8,
  deliveredKWhPerSelectedHomePerCycle: 10,
  cyclesPerYear: 300,
  roundTripEfficiency: 0.9,
  rolloutTargetMonths: [24, 36, 48],
  darlingtonNameplateGW: 1.2,
  illustrativeNuclearCapacityFactor: 0.9,
};
const a = assumptions;
const solarHomesProxy = a.totalSolarInstallationsMilestone * a.residentialShare;
const selectedHomes = solarHomesProxy * a.incrementalBatteryAdoptionShare;
const energyGWh = selectedHomes * a.newBatteryUsableKWhPerSelectedHome / 1e6;
const priceUSD = selectedHomes * a.typicalInstalledBenchmarkUSD;
const darlingtonUSD = a.darlingtonFourUnitBudgetCAD / a.exchangeRateCADPerUSD;
const annualDeliveredKWh = selectedHomes * a.deliveredKWhPerSelectedHomePerCycle * a.cyclesPerYear;
const annualChargingKWh = annualDeliveredKWh / a.roundTripEfficiency;
const results = {
  solarHomesProxy,
  selectedHomes,
  energyGWh,
  theoreticalFourHourGW: energyGWh / a.dispatchDurationHours,
  illustrativeFourHourGWAfterReserveAndAvailability: energyGWh / a.dispatchDurationHours * (1 - a.reserveEnergyFraction) * a.availableFleetFraction,
  annualShiftedEnergyTWh: annualDeliveredKWh / 1e9,
  annualChargingEnergyTWh: annualChargingKWh / 1e9,
  costs: a.priceSensitivityUSD.map((perHomeUSD, i) => ({ perHomeUSD, totalUSD: perHomeUSD * selectedHomes, basis: a.priceSensitivityBasis[i] })),
  darlingtonUSD,
  baselineBatteryCostToDarlingtonBudgetRatio: priceUSD / darlingtonUSD,
  sameBudgetBatteryHomes: darlingtonUSD / a.typicalInstalledBenchmarkUSD,
  sameBudgetBatteryEnergyGWh: darlingtonUSD / a.typicalInstalledBenchmarkUSD * a.newBatteryUsableKWhPerSelectedHome / 1e6,
  maxPerHomePriceToFitAllSelectedHomesIntoDarlingtonBudgetUSD: darlingtonUSD / selectedHomes,
  rolloutTargets: a.rolloutTargetMonths.map(months => ({ months, completedHomesPerMonth: selectedHomes / months, installedGWhPerYear: energyGWh * 12 / months })),
  illustrativeDarlingtonGeneratedEnergyTWhPerYear: a.darlingtonNameplateGW * 8760 * a.illustrativeNuclearCapacityFactor / 1000,
  operationalCarbonIllustrations: [
    { label: 'Otherwise-curtailed solar charging; displaces 0.4 kg CO2/kWh peak supply', chargingOpportunityEmissionKgPerKWh: 0, displacedEmissionKgPerKWh: 0.4 },
    { label: 'Charging forgoes exports displacing 0.3 kg CO2/kWh; discharge displaces 0.4', chargingOpportunityEmissionKgPerKWh: 0.3, displacedEmissionKgPerKWh: 0.4 },
    { label: 'Same marginal 0.4 kg CO2/kWh at charging and discharge; losses increase emissions', chargingOpportunityEmissionKgPerKWh: 0.4, displacedEmissionKgPerKWh: 0.4 },
  ].map(s => ({ ...s, avoidedMillionTonnesCO2PerYear: (annualDeliveredKWh * s.displacedEmissionKgPerKWh - annualChargingKWh * s.chargingOpportunityEmissionKgPerKWh) / 1e9 })),
};
const approx = (actual, expected) => assert.ok(Math.abs(actual - expected) < Math.max(1e-8, Math.abs(expected) * 1e-10));
assert.equal(selectedHomes, 2_910_000);
approx(energyGWh, 39.285);
assert.equal(priceUSD, 45_532_770_000);
approx(results.theoreticalFourHourGW, 9.82125);
approx(results.illustrativeFourHourGWAfterReserveAndAvailability, 6.2856);
approx(results.annualShiftedEnergyTWh, 8.73);
approx(results.annualChargingEnergyTWh, 9.7);
approx(darlingtonUSD * a.exchangeRateCADPerUSD, a.darlingtonFourUnitBudgetCAD);
approx(results.sameBudgetBatteryHomes * a.typicalInstalledBenchmarkUSD, darlingtonUSD);
assert.ok(results.operationalCarbonIllustrations[2].avoidedMillionTonnesCO2PerYear < 0);
for (const r of results.rolloutTargets) approx(r.completedHomesPerMonth * r.months, selectedHomes);
const report = {
  assumptions, sources, results,
  limitations: [
    'Incremental one-battery addition at half of existing solar homes; not an estimate of batteries needed to reach 50 percent total penetration. Existing storage has not been subtracted.',
    'Storage shifts energy; it does not create the solar electricity required to charge it.',
    'Power calculations assume adequate inverter power, charge, permissions and geographically useful access; they are not accredited firm capacity.',
    'Retail installed-price benchmark is not a Prosper quote or a guaranteed solar-retrofit price. No incentives assumed.',
    'Capital comparison only: currencies aligned, but retail battery and all-in nuclear budget cost scopes and service lives differ. No equal-service or levelized-cost claim.',
    'Original PV cost is sunk and excluded. Additional PV, repairs, financing, aggregation, network upgrades, degradation, and replacements are not independently priced.',
    'Rollout durations, utilization, efficiency, availability and carbon factors are assumptions, not verified national outcomes.',
    'Carbon illustrations exclude embodied emissions and use hypothetical marginal-grid counterfactuals. They are not estimates of national emissions savings.',
  ],
  verification: 'Arithmetic, unit conversion, cost identity, scenario conservation and carbon-sign checks passed',
};
const out = fileURLToPath(new URL('../outputs/smr-review/HALF-SOLAR-BATTERY-MODEL.json', import.meta.url));
writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output: out, selectedHomes, energyGWh, baselineCostUSD: priceUSD, darlingtonUSD, verification: report.verification }, null, 2));
