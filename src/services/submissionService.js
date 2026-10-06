const { z } = require('zod');
const { HttpError } = require('../errors');
const widgetRepository = require('../repositories/widgetRepository');
const submissionRepository = require('../repositories/submissionRepository');
const geoService = require('./geoService');
const notificationService = require('./notificationService');

const bodySchema = z.object({
  widgetId: z.string().min(1).max(64),
  data: z.record(z.string(), z.any()),
  honeypot: z.string().max(200).optional(),
});

function buildFieldSchema(field) {
  let schema;
  if (field.type === 'email') {
    schema = z.string().trim().email().max(254);
  } else if (field.type === 'number') {
    schema = z.number();
  } else if (field.type === 'textarea') {
    schema = z.string().trim().max(5000);
  } else {
    schema = z.string().trim().max(500);
  }
  if (field.required) {
    if (field.type !== 'number' && field.type !== 'email') {
      schema = schema.min(1);
    }
    return schema;
  }
  return schema.optional();
}

async function submit(body, ip, options = {}) {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid submission payload');
  }
  if (parsed.data.honeypot && parsed.data.honeypot.length > 0) {
    console.warn('Honeypot triggered', ip);
    return { id: '0' };
  }
  const widget = await widgetRepository.findPublicById(parsed.data.widgetId);
  if (!widget) {
    throw new HttpError(404, 'Widget not found');
  }
  const shape = {};
  for (const field of widget.fields) {
    shape[field.name] = buildFieldSchema(field);
  }
  const dataResult = z.object(shape).strict().safeParse(parsed.data.data);
  if (!dataResult.success) {
    throw new HttpError(400, 'Invalid form data');
  }
  const geo = await geoService.enrich(ip, { mockDown: options.mockGeoDown });
  const row = await submissionRepository.create({
    widgetId: widget.id,
    ownerId: widget.owner_id,
    data: dataResult.data,
    ip,
    country: geo ? geo.country : null,
    city: geo ? geo.city : null,
  });
  notificationService.dispatch(
    { id: row.id, widgetId: widget.id, ownerId: widget.owner_id },
    { mockFail: options.mockEmailFail === 'true' },
  );
  return { id: row.id };
}

module.exports = { submit };
