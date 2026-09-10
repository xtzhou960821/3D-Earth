/**
 * Best-effort BIM / feature property extraction from Cesium pick results.
 */

/** One property row shown in the pick panel. */
export interface BimPropertyRow {
  key: string;
  value: string;
}

/** Payload for the properties side panel after a pick. */
export interface BimPickInfo {
  layerId: string;
  layerName: string;
  title: string;
  properties: BimPropertyRow[];
  /** True when we only have layer-level / empty metadata. */
  empty: boolean;
}

/** Sidecar JSON written next to IFC→GLB uploads. */
export interface BimFeatureRecord {
  expressID: number;
  ifcType?: string | number;
  Name?: string;
  GlobalId?: string;
  ObjectType?: string;
  Tag?: string;
  [key: string]: string | number | undefined;
}

/**
 * Normalize arbitrary property bags into display rows.
 * @param source Object-like property map
 */
export function rowsFromRecord(
  source: Record<string, unknown> | null | undefined,
): BimPropertyRow[] {
  if (!source) return [];
  return Object.entries(source)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([key, value]) => ({
      key,
      value: typeof value === "object" ? JSON.stringify(value) : String(value),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Read Cesium feature property APIs when present (3D Tiles / ModelFeature).
 * @param feature Picked object that may expose getPropertyIds
 */
export function rowsFromCesiumFeature(feature: unknown): BimPropertyRow[] {
  const f = feature as {
    getPropertyIds?: () => string[];
    getProperty?: (name: string) => unknown;
  };
  if (!f?.getPropertyIds || !f.getProperty) return [];
  try {
    const ids = f.getPropertyIds();
    return ids
      .map((key) => {
        const value = f.getProperty!(key);
        if (value === undefined || value === null || value === "") return null;
        return {
          key,
          value:
            typeof value === "object" ? JSON.stringify(value) : String(value),
        };
      })
      .filter((row): row is BimPropertyRow => !!row)
      .sort((a, b) => a.key.localeCompare(b.key));
  } catch {
    return [];
  }
}

/**
 * Build pick panel info from feature rows or a BIM sidecar list.
 * @param opts Layer + optional feature / sidecar data
 */
export function buildBimPickInfo(opts: {
  layerId: string;
  layerName: string;
  featureRows?: BimPropertyRow[];
  sidecar?: BimFeatureRecord[] | null;
  pickedExpressId?: number;
}): BimPickInfo {
  const featureRows = opts.featureRows || [];
  if (featureRows.length) {
    return {
      layerId: opts.layerId,
      layerName: opts.layerName,
      title: "构件属性",
      properties: featureRows,
      empty: false,
    };
  }
  if (opts.sidecar?.length) {
    if (opts.pickedExpressId != null) {
      const hit = opts.sidecar.find((r) => r.expressID === opts.pickedExpressId);
      if (hit) {
        return {
          layerId: opts.layerId,
          layerName: opts.layerName,
          title: hit.Name || `IFC #${hit.expressID}`,
          properties: rowsFromRecord(hit as Record<string, unknown>),
          empty: false,
        };
      }
    }
    const preview = opts.sidecar.slice(0, 40).flatMap((r, i) =>
      rowsFromRecord({
        [`[${i}] expressID`]: r.expressID,
        [`[${i}] Name`]: r.Name,
        [`[${i}] Type`]: r.ifcType,
        [`[${i}] GlobalId`]: r.GlobalId,
      }),
    );
    return {
      layerId: opts.layerId,
      layerName: opts.layerName,
      title: `构件索引（${opts.sidecar.length}）`,
      properties: preview,
      empty: false,
    };
  }
  return {
    layerId: opts.layerId,
    layerName: opts.layerName,
    title: "属性",
    properties: [],
    empty: true,
  };
}
