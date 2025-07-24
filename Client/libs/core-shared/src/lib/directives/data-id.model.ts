/**
 * Mapping of Pendo feature tags used for automatic element identification.
 *
 * Each key represents a distinct, atomic feature (e.g. 'add', 'delete') that corresponds
 * to a user interaction or UI control. The values are arrays of normalized text fragments
 * that may appear in element attributes (e.g., `aria-label`, `title`) or content,
 * and are used for matching during automated tagging.
 *
 * @remarks
 * ⚠️ **Important:**
 * - Do **not** rename or remove existing keys, as this may break existing analytics tracking.
 * - You may safely add new keys and keyword aliases.
 * - No duplicate aliases across keys.
 * - Verify that your automatic tagging is adding the right data-id and/or id.
 * - Ensure the associated keywords are lowercase, concise, and only include
 * meaningful, actionable terms that represent interactive UI elements.
 *
 * ❌ Modifications: Do not change existing key names or associated keywords.
 *
 */
export const PENDO_FEATURES = {
  default: ['default'],
  export_excel: ['export', 'excel', 'export_excel', 'send_excel'],
  download: ['download', 'file'],
  settings: ['settings'],
  view_history: ['view', 'history', 'view_history'],
  bookmark: ['bookmark'],
  import: ['import', 'upload'],
  cancel: ['cancel', 'dismiss', 'abort'],
  close: ['close', 'x'], // 'X' button
  save_new: ['Save & New'], // Too similar to 'save', pass the dataId manually // todo: better handle similar keys/values
  link: ['go', 'visit'],
  save: ['save'],
  apply: ['apply'],
  filters: ['filters', 'filter'],
  drag_drop: ['drag_drop'],
  compare: ['compare'],
  add: ['add'],
  delete: ['delete', 'remove'],
  edit: ['edit', 'modify'],
  more: ['more', 'actions', 'options'],
  alerts: ['alerts', 'alert'],
  scroll: ['scroll', 'top'],
  info: ['help', 'history'],
  design: ['design'],
  pivot: ['pivot'],
  grid: ['grid'],
} as const;
export type PendoFeature = keyof typeof PENDO_FEATURES;

/**
 * Use this Data Type Object for when you need to provide further
 * configuration options to the data-id value
 *
 * @export
 * @interface DataIdObject
 */
export interface DataIdObject {
  dataId: PendoFeature;
  /**
   * Adds a string after the dataId.
   * @optional
   */
  suffix?: string;
  /**
   * Adds a string before the dataId.
   * @optional
   */
  prefix?: string;
  /**
   * Automatically attaches an HTML `id` attribute when the `dataId` directive is applied,
   * unless an `id` is already present.
   *
   * The `id` value will match the `dataId`. To maintain consistency, omit the `id` parameter.
   *
   * @note This behavior is enabled by default.
   */
  generateId?: boolean;
}

/**
 * Type-guard: is this unknown value one of our PendoFeature keys?
 */
export function isPendoFeature(value: unknown): value is PendoFeature {
  return typeof value === 'string' && value in PENDO_FEATURES;
}

export const SYNONYM_TO_FEATURE = new Map<string, PendoFeature>();
for (const key of Object.keys(PENDO_FEATURES) as PendoFeature[]) {
  for (const syn of PENDO_FEATURES[key]) {
    SYNONYM_TO_FEATURE.set(syn, key);
  }
}
