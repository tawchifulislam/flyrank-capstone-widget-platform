const { z } = require('zod');
const { HttpError } = require('../errors');
const widgetRepository = require('../repositories/widgetRepository');
const dashboardRepository = require('../repositories/dashboardRepository');

const listSchema = z.object({
  widgetId: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const statsSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

async function listSubmissions(ownerId, query) {
  const parsed = listSchema.safeParse(query);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid query');
  }
  const { widgetId, limit, offset } = parsed.data;
  if (widgetId) {
    const widget = await widgetRepository.findByIdForOwner(widgetId, ownerId);
    if (!widget) {
      throw new HttpError(404, 'Widget not found');
    }
  }
  const result = await dashboardRepository.listSubmissions({
    ownerId,
    widgetId,
    limit,
    offset,
  });
  return {
    total: result.total,
    limit,
    offset,
    items: result.rows.map(row => ({
      id: row.id,
      widgetId: row.widget_id,
      data: row.data,
      country: row.country,
      city: row.city,
      createdAt: row.created_at,
    })),
  };
}

async function stats(ownerId, query) {
  const parsed = statsSchema.safeParse(query);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid query');
  }
  const { days } = parsed.data;
  const [total, perDay, perWidget, perCountry] = await Promise.all([
    dashboardRepository.totalInWindow(ownerId, days),
    dashboardRepository.countsPerDay(ownerId, days),
    dashboardRepository.countsPerWidget(ownerId, days),
    dashboardRepository.countsPerCountry(ownerId, days),
  ]);
  return {
    days,
    total,
    perDay,
    perWidget: perWidget.map(row => ({
      widgetId: row.id,
      title: row.title,
      count: row.count,
    })),
    perCountry,
  };
}

module.exports = { listSubmissions, stats };
