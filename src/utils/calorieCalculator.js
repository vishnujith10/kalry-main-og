// calorieCalculator.js

// Kalry Rule-Based Calorie Calculation System

function calculateBMR(gender, weight_kg, height_cm, age) {
  return gender === 'male'
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
}

function calculateTDEE(bmr, activity_level) {
  const multiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9
  };
  return bmr * (multiplier[activity_level] || 1.2);
}

function adjustForGoal(tdee, goal) {
  switch (goal) {
    case 'lose': return tdee * 0.85;
    case 'gain': return tdee * 1.10;
    default: return tdee;
  }
}

function getMacroTargets(calories) {
  return {
    protein_g: +(calories * 0.3 / 4).toFixed(2),
    fat_g: +(calories * 0.3 / 9).toFixed(2),
    carbs_g: +(calories * 0.4 / 4).toFixed(2)
  };
}

function getMinCalories(gender) {
  return gender === 'male' ? 1500 : 1200;
}

/**
 * Calculate all calorie and macro targets for a user
 * @param {Object} params
 * @param {number} params.age
 * @param {string} params.gender - 'male' or 'female'
 * @param {number} params.weight_kg
 * @param {number} params.height_cm
 * @param {string} params.activity_level - 'sedentary', 'light', 'moderate', 'very', 'extra'
 * @param {string} params.goal_type - 'maintain', 'lose', 'gain'
 * @returns {Object} { bmr, tdee, calorie_goal, macro_targets }
 */
function calculateCalorieProfile({ age, gender, weight_kg, height_cm, activity_level, goal_type }) {
  const bmr = calculateBMR(gender, weight_kg, height_cm, age);
  const tdee = calculateTDEE(bmr, activity_level);
  let calorie_goal = adjustForGoal(tdee, goal_type);
  const minCalories = getMinCalories(gender);
  if (calorie_goal < minCalories) calorie_goal = minCalories;
  calorie_goal = +calorie_goal.toFixed(2);
  const macro_targets = getMacroTargets(calorie_goal);
  return { bmr: +bmr.toFixed(2), tdee: +tdee.toFixed(2), calorie_goal, macro_targets };
}

export default calculateCalorieProfile; 