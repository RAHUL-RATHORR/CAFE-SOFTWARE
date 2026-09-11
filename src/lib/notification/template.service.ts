export class TemplateService {
  /**
   * Safely interpolates variables into a template string.
   * Only allows simple variable replacement {{varName}} to prevent injection.
   */
  static render(template: string, variables: Record<string, any>): string {
    if (!template) return "";
    
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      // Safely handle null/undefined
      if (value === null || value === undefined) {
        return "";
      }
      
      // Prevent object injection by stringifying safely, or just converting to string
      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return "[Object]";
        }
      }
      
      // Escape HTML if needed? For emails yes, but WhatsApp/SMS it's plain text usually.
      // Since we don't know the channel at this exact string replacement step, we'll just stringify.
      // The frontend should treat output safely.
      return String(value);
    });
  }

  /**
   * Returns a list of variables found in the template string.
   */
  static extractVariables(template: string): string[] {
    if (!template) return [];
    
    const matches = template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
    const vars = new Set<string>();
    
    for (const match of matches) {
      if (match[1]) {
        vars.add(match[1]);
      }
    }
    
    return Array.from(vars);
  }
}
