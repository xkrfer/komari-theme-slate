import { z } from "zod";

const numberish = z.coerce.number().optional().default(0);
const stringish = z.string().optional().default("");

export const appearanceSchema = z.enum(["system", "light", "dark"]);
export const homeViewSchema = z.enum(["table", "cards", "map"]);
export const defaultLanguageSchema = z.enum(["auto", "zh-CN", "en"]);
export const nodeSortSchema = z.enum([
  "name",
  "status",
  "region",
  "uptime",
  "cpu",
  "memory",
  "disk",
  "speed",
]);
export const sortDirectionSchema = z.enum(["asc", "desc"]);

export const themeSettingsSchema = z
  .object({
    defaultAppearance: appearanceSchema.optional().default("system"),
    defaultView: homeViewSchema.optional().default("table"),
    defaultLanguage: defaultLanguageSchema.optional().default("auto"),
    defaultSort: nodeSortSchema.optional().default("name"),
    defaultSortDirection: sortDirectionSchema.optional().default("asc"),
    showStats: z.boolean().optional().default(true),
    enableMap: z.boolean().optional().default(true),
    showCardTags: z.boolean().optional().default(true),
    showCardBilling: z.boolean().optional().default(true),
    showResourceTotals: z.boolean().optional().default(true),
    showCardTraffic: z.boolean().optional().default(true),
    showCardSwap: z.boolean().optional().default(true),
    showUptime: z.boolean().optional().default(true),
    uptimeRefreshSeconds: z.coerce
      .number()
      .min(1)
      .max(60)
      .catch(1)
      .optional()
      .default(1),
    guestShowPrice: z.boolean().optional().default(false),
    guestShowExpiration: z.boolean().optional().default(false),
  })
  .passthrough();

const defaultThemeSettings = themeSettingsSchema.parse({});

export const publicInfoSchema = z
  .object({
    sitename: stringish,
    description: stringish,
    theme: stringish,
    theme_settings: z
      .unknown()
      .optional()
      .transform((value) => {
        const parsed = themeSettingsSchema.safeParse(value ?? {});
        return parsed.success ? parsed.data : defaultThemeSettings;
      }),
    private_site: z.boolean().optional().default(false),
    disable_password_login: z.boolean().optional().default(false),
    oauth_enable: z.boolean().optional().default(false),
  })
  .passthrough();

export const meInfoSchema = z
  .object({
    logged_in: z.boolean().optional().default(false),
    username: stringish,
    uuid: stringish,
  })
  .passthrough();

export const clientSchema = z
  .object({
    uuid: z.string(),
    name: stringish,
    region: stringish,
    group: stringish,
    cpu_name: stringish,
    gpu_name: stringish,
    virtualization: stringish,
    arch: stringish,
    os: stringish,
    kernel_version: stringish,
    ipv4: stringish,
    ipv6: stringish,
    tags: stringish,
    price: numberish,
    currency: z.string().optional().default("$"),
    billing_cycle: numberish,
    auto_renewal: z.boolean().optional().default(false),
    expired_at: z.string().nullable().optional().default(null),
    cpu_cores: numberish,
    mem_total: numberish,
    swap_total: numberish,
    disk_total: numberish,
    traffic_limit: numberish,
    weight: numberish,
  })
  .passthrough();

export const nodeStatusSchema = z
  .object({
    client: stringish,
    time: stringish,
    online: z.boolean().optional().default(false),
    cpu: numberish,
    gpu: numberish,
    ram: numberish,
    ram_total: numberish,
    swap: numberish,
    swap_total: numberish,
    load: numberish,
    load5: numberish,
    load15: numberish,
    disk: numberish,
    disk_total: numberish,
    net_in: numberish,
    net_out: numberish,
    net_total_up: numberish,
    net_total_down: numberish,
    process: numberish,
    connections: numberish,
    connections_udp: numberish,
    uptime: z.coerce.number().optional(),
    ping: z
      .record(
        z.string(),
        z
          .object({
            latest: z.number().optional(),
            avg: z.number().optional(),
            name: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export const pingTaskSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: stringish,
    default_on: z.boolean().optional().default(false),
    clients: z.array(z.string()).optional().default([]),
    type: stringish,
    interval: numberish,
  })
  .passthrough();

export const pingMetricStatSchema = z
  .object({
    entity_id: stringish,
    task_id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    interval: z.number().optional(),
    total: z.number().optional(),
    valid: z.number().optional(),
    loss: z.number().optional(),
    loss_approximate: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    latest: z.number().optional(),
    avg: z.number().optional(),
    p50: z.number().optional(),
    p99: z.number().optional(),
    stddev: z.number().optional(),
    p99_p50_ratio: z.number().optional(),
  })
  .passthrough();

export const pingMetricStatsRespSchema = z
  .object({
    stats: z.array(pingMetricStatSchema).optional().default([]),
  })
  .passthrough();

export const loadRecordSchema = z
  .object({
    client: stringish,
    time: stringish,
    cpu: numberish,
    ram: numberish,
    ram_total: numberish,
    swap: numberish,
    swap_total: numberish,
    load: numberish,
    disk: numberish,
    disk_total: numberish,
    net_in: numberish,
    net_out: numberish,
    net_total_up: numberish,
    net_total_down: numberish,
    process: numberish,
    connections: numberish,
    connections_udp: numberish,
  })
  .passthrough();

export const pingRecordSchema = z
  .object({
    time: stringish,
    value: z.number().optional().default(0),
    task_id: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const loginResultSchema = z
  .object({
    status: z.string().optional(),
    message: z.string().optional().default(""),
  })
  .passthrough();

export type Appearance = z.infer<typeof appearanceSchema>;
export type HomeView = z.infer<typeof homeViewSchema>;
export type DefaultLanguage = z.infer<typeof defaultLanguageSchema>;
export type NodeSort = z.infer<typeof nodeSortSchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;
export type PublicInfo = z.infer<typeof publicInfoSchema>;
export type MeInfo = z.infer<typeof meInfoSchema>;
export type Client = z.infer<typeof clientSchema>;
export type NodeStatus = z.infer<typeof nodeStatusSchema>;
export type PingTask = z.infer<typeof pingTaskSchema>;
export type PingMetricStat = z.infer<typeof pingMetricStatSchema>;
export type LoadRecord = z.infer<typeof loadRecordSchema>;
export type PingRecord = z.infer<typeof pingRecordSchema>;
