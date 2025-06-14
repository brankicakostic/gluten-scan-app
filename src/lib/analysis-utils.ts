
// Utility functions for AI analysis results

// Define the type for an assessed ingredient based on the AI flow's output schema
// This should match or be compatible with IngredientAssessment from analyze-declaration.ts
export interface AssessedIngredient {
  sastojak: string;
  ocena: "sigurno" | "rizično – proveriti poreklo" | "nije bezbedno";
  nivoRizika: "visok" | "umeren" | "nizak";
  kategorijaRizika?: string;
  napomena?: string;
}

/**
 * Counts relevant gluten-related issues from a list of assessed ingredients.
 * An issue is relevant if:
 * - The risk level is "high".
 * - The risk level is "moderate" AND the risk category is "gluten" or "unakrsna kontaminacija".
 * @param assessedIngredients Array of ingredients assessed by the AI.
 * @returns The number of relevant gluten-related issues.
 */
export function countRelevantGlutenIssues(assessedIngredients: AssessedIngredient[]): number {
  if (!Array.isArray(assessedIngredients)) {
    return 0;
  }
  return assessedIngredients.filter(i => {
    if (i.nivoRizika === "visok") return true;
    if (i.nivoRizika === "umeren" && 
        (i.kategorijaRizika === "gluten" || i.kategorijaRizika === "unakrsna kontaminacija")) {
      return true;
    }
    return false;
  }).length;
}
