/**
 * Theme Validation Utility
 *
 * This utility helps validate custom themes to ensure they don't break layout functionality.
 * It checks for dangerous CSS properties and provides warnings for potentially problematic themes.
 */

export interface ThemeValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

export interface CSSRule {
  selector: string
  properties: Record<string, string>
}

export class ThemeValidator {
  private static readonly DANGEROUS_PROPERTIES = [
    // Layout properties that should NEVER be modified by themes
    'position',
    'display',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'overflow',
    'overflow-x',
    'overflow-y',
    'z-index',
    'transform',
    'transition',
    'animation',
    'flex',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'flex-direction',
    'flex-wrap',
    'grid',
    'grid-template',
    'grid-template-areas',
    'grid-template-columns',
    'grid-template-rows',
    'grid-area',
    'grid-column',
    'grid-row',
    'float',
    'clear',
    'top',
    'right',
    'bottom',
    'left',
  ]

  private static readonly WARNING_PROPERTIES = [
    // Properties that might cause issues if used incorrectly
    'box-sizing',
    'vertical-align',
    'text-align',
    'line-height',
    'white-space',
    'word-break',
    'word-wrap',
  ]

  private static readonly SAFE_PROPERTIES = [
    // Properties that are safe to modify in themes
    'background',
    'background-color',
    'background-image',
    'background-size',
    'background-position',
    'background-repeat',
    'color',
    'border',
    'border-color',
    'border-style',
    'border-width',
    'border-radius',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'font-variant',
    'text-decoration',
    'text-shadow',
    'box-shadow',
    'opacity',
    'outline',
    'outline-color',
    'outline-style',
    'outline-width',
    'cursor',
    'filter',
    'backdrop-filter',
  ]

  /**
   * Validates a theme's CSS content for potentially dangerous properties
   */
  static validateCSS(cssContent: string, themeId: string): ThemeValidationResult {
    const result: ThemeValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: [],
    }

    try {
      const rules = this.parseCSS(cssContent)

      for (const rule of rules) {
        const validation = this.validateCSSRule(rule, themeId)

        if (validation.errors.length > 0) {
          result.isValid = false
          result.errors.push(...validation.errors)
        }

        if (validation.warnings.length > 0) {
          result.warnings.push(...validation.warnings)
        }

        if (validation.suggestions.length > 0) {
          result.suggestions.push(...validation.suggestions)
        }
      }

      // Add general suggestions
      result.suggestions.push(
        'Use CSS custom properties (--theme-*) for consistent theming',
        'Test your theme on different screen sizes',
        'Ensure sidebar functionality works correctly',
        'Verify button and input sizing remains appropriate'
      )
    } catch (error) {
      result.isValid = false
      result.errors.push(`Failed to parse CSS: ${error}`)
    }

    return result
  }

  /**
   * Validates a single CSS rule
   */
  private static validateCSSRule(rule: CSSRule, themeId: string): ThemeValidationResult {
    const result: ThemeValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: [],
    }

    // Check if this rule targets layout-critical elements
    const isLayoutCritical = this.isLayoutCriticalSelector(rule.selector)

    for (const [property, value] of Object.entries(rule.properties)) {
      const normalizedProperty = property.toLowerCase().trim()

      // Check for dangerous properties
      if (this.DANGEROUS_PROPERTIES.includes(normalizedProperty)) {
        result.isValid = false
        result.errors.push(
          `DANGEROUS: ${normalizedProperty} in "${rule.selector}" - This property can break layout functionality`
        )

        if (isLayoutCritical) {
          result.errors.push(
            `CRITICAL: Modifying ${normalizedProperty} on "${rule.selector}" will definitely break the layout`
          )
        }
      }

      // Check for warning properties
      else if (this.WARNING_PROPERTIES.includes(normalizedProperty)) {
        result.warnings.push(
          `WARNING: ${normalizedProperty} in "${rule.selector}" - Use with caution, may affect layout`
        )
      }

      // Check for !important usage on dangerous properties
      if (value.includes('!important') && this.DANGEROUS_PROPERTIES.includes(normalizedProperty)) {
        result.isValid = false
        result.errors.push(
          `CRITICAL: Using !important with ${normalizedProperty} in "${rule.selector}" will definitely break layout`
        )
      }
    }

    // Check for overly generic selectors
    if (this.isOverlyGenericSelector(rule.selector)) {
      result.warnings.push(
        `WARNING: Generic selector "${rule.selector}" may affect unintended elements`
      )
      result.suggestions.push(
        `Consider using more specific selectors like ".theme-${themeId} .sidebar"`
      )
    }

    return result
  }

  /**
   * Checks if a selector targets layout-critical elements
   */
  private static isLayoutCriticalSelector(selector: string): boolean {
    const criticalSelectors = [
      '.sidebar',
      '.app-sidebar',
      '.app-layout',
      '.layout',
      '.app-header',
      '.header',
      '.main-content',
      '.content',
    ]

    return criticalSelectors.some(critical => selector.includes(critical))
  }

  /**
   * Checks if a selector is overly generic
   */
  private static isOverlyGenericSelector(selector: string): boolean {
    const genericPatterns = [
      /^\*$/, // *
      /^[a-z]+$/, // div, span, button
      /^\.theme-[^ ]*$/, // .theme-windows95 (without context)
      /^[a-z]+ \*$/, // div *
      /^\.theme-[^ ]* \*$/, // .theme-windows95 *
    ]

    return genericPatterns.some(pattern => pattern.test(selector.trim()))
  }

  /**
   * Parses CSS content into structured rules
   * Note: This is a simplified parser for validation purposes
   */
  private static parseCSS(cssContent: string): CSSRule[] {
    const rules: CSSRule[] = []

    // Remove comments
    const cleanCSS = cssContent.replace(/\/\*[\s\S]*?\*\//g, '')

    // Split into rules (simplified)
    const ruleBlocks = cleanCSS.split('}')

    for (const block of ruleBlocks) {
      if (!block.trim()) continue

      const colonIndex = block.indexOf('{')
      if (colonIndex === -1) continue

      const selector = block.substring(0, colonIndex).trim()
      const propertiesBlock = block.substring(colonIndex + 1).trim()

      if (!selector || !propertiesBlock) continue

      const properties: Record<string, string> = {}
      const propertyLines = propertiesBlock.split(';')

      for (const line of propertyLines) {
        const colonPos = line.indexOf(':')
        if (colonPos === -1) continue

        const property = line.substring(0, colonPos).trim()
        const value = line.substring(colonPos + 1).trim()

        if (property && value) {
          properties[property] = value
        }
      }

      if (Object.keys(properties).length > 0) {
        rules.push({ selector, properties })
      }
    }

    return rules
  }

  /**
   * Generates a safe theme template
   */
  static generateSafeThemeTemplate(themeId: string): string {
    return `/* Safe Theme Template for ${themeId} */
/* This template only includes safe CSS properties */

.theme-${themeId} {
  /* Colors - Safe to modify */
  --theme-primary: #3b82f6;
  --theme-secondary: #6b7280;
  --theme-background: #ffffff;
  --theme-surface: #f8fafc;
  --theme-text: #1e293b;
  --theme-border: #e2e8f0;
  --theme-hover: #f1f5f9;
  --theme-active: #1d4ed8;

  /* Typography - Safe to modify */
  --theme-font-family: "Inter", sans-serif;
  --theme-font-size-base: 14px;
  --theme-font-size-small: 12px;
  --theme-font-size-large: 16px;
  --theme-font-weight-normal: 400;
  --theme-font-weight-medium: 500;
  --theme-font-weight-bold: 700;

  /* Shadows - Safe to modify */
  --theme-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --theme-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --theme-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Border radius - Safe to modify */
  --theme-border-radius: 8px;
  --theme-border-radius-sm: 4px;
  --theme-border-radius-lg: 12px;
}

/* Apply theme styles - ONLY VISUAL PROPERTIES */
.theme-${themeId} {
  background: var(--theme-background);
  color: var(--theme-text);
  font-family: var(--theme-font-family);
  font-size: var(--theme-font-size-base);
}

/* Button styling - Safe properties only */
.theme-${themeId} .p-button,
.theme-${themeId} button {
  background: var(--theme-surface);
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-border-radius);
  box-shadow: var(--theme-shadow-sm);
  /* DON'T modify: padding, margin, width, height, position, display */
}

/* Sidebar styling - Safe properties only */
.theme-${themeId} .sidebar {
  background: var(--theme-surface);
  border-right: 1px solid var(--theme-border);
  box-shadow: var(--theme-shadow-md);
  /* DON'T modify: position, width, height, transform, z-index */
}

/* Input styling - Safe properties only */
.theme-${themeId} input,
.theme-${themeId} .p-inputtext {
  background: var(--theme-surface);
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-border-radius);
  /* DON'T modify: padding, margin, width, height */
}

/* Card styling - Safe properties only */
.theme-${themeId} .card,
.theme-${themeId} .p-card {
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-border-radius);
  box-shadow: var(--theme-shadow-sm);
  /* DON'T modify: padding, margin, width, height */
}

/* Hover states - Safe properties only */
.theme-${themeId} button:hover,
.theme-${themeId} .p-button:hover {
  background: var(--theme-hover);
  box-shadow: var(--theme-shadow-md);
}

/* Focus states - Safe properties only */
.theme-${themeId} button:focus,
.theme-${themeId} .p-button:focus,
.theme-${themeId} input:focus {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
}
`
  }

  /**
   * Provides suggestions for fixing validation issues
   */
  static getFixSuggestions(validationResult: ThemeValidationResult): string[] {
    const suggestions: string[] = []

    if (validationResult.errors.length > 0) {
      suggestions.push(
        'Remove all layout-related properties (position, display, width, height, margin, padding)',
        'Replace layout properties with visual-only properties (background, color, border, box-shadow)',
        'Use CSS custom properties for consistent theming',
        'Test your theme to ensure sidebar functionality works'
      )
    }

    if (validationResult.warnings.length > 0) {
      suggestions.push(
        'Review properties that may affect layout behavior',
        'Consider using more specific selectors',
        'Test responsive behavior on different screen sizes'
      )
    }

    return suggestions
  }
}

export default ThemeValidator
