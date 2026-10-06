const crypto = require('crypto');
const { z } = require('zod');
const config = require('../config');
const { HttpError } = require('../errors');
const widgetRepository = require('../repositories/widgetRepository');

const fieldSchema = z.object({
  name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,29}$/),
  label: z.string().min(1).max(80),
  type: z.enum(['text', 'email', 'textarea', 'number']),
  required: z.boolean().default(false),
});

const widgetSchema = z.object({
  type: z.enum(['signup', 'contact', 'cta']),
  title: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  buttonText: z.string().min(1).max(40).default('Submit'),
  fields: z.array(fieldSchema).max(20).default([]),
  displayOptions: z.record(z.string(), z.any()).default({}),
});

function parseWidget(body) {
  const parsed = widgetSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid widget payload');
  }
  return parsed.data;
}

function toApi(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    buttonText: row.button_text,
    fields: row.fields,
    displayOptions: row.display_options,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    embedSnippet: `<script src="${config.publicBaseUrl}/widget.js?id=${row.id}"></script>`,
  };
}

async function create(ownerId, body) {
  const data = parseWidget(body);
  const row = await widgetRepository.create({
    id: crypto.randomBytes(9).toString('base64url'),
    ownerId,
    ...data,
  });
  return toApi(row);
}

async function list(ownerId) {
  const rows = await widgetRepository.listByOwner(ownerId);
  return rows.map(toApi);
}

async function get(ownerId, id) {
  const row = await widgetRepository.findByIdForOwner(id, ownerId);
  if (!row) {
    throw new HttpError(404, 'Widget not found');
  }
  return toApi(row);
}

async function update(ownerId, id, body) {
  const data = parseWidget(body);
  const row = await widgetRepository.update(id, ownerId, data);
  if (!row) {
    throw new HttpError(404, 'Widget not found');
  }
  return toApi(row);
}

async function remove(ownerId, id) {
  const removed = await widgetRepository.remove(id, ownerId);
  if (!removed) {
    throw new HttpError(404, 'Widget not found');
  }
}

async function getPublicConfig(id) {
  const row = await widgetRepository.findPublicById(id);
  if (!row) {
    throw new HttpError(404, 'Widget not found');
  }
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    buttonText: row.button_text,
    fields: row.fields,
    displayOptions: row.display_options,
    version: row.version,
  };
}

module.exports = { create, list, get, update, remove, getPublicConfig };
