const Joi = require("joi");

// HH:mm (24h) format
const hhmm = Joi.string().pattern(/^\d{2}:\d{2}$/);

const timeRangeSchema = Joi.object({
  start: hhmm.required(),
  end: hhmm.required(),
}).required();

const availabilitySchema = Joi.alternatives()
  .try(
    // permanent: optional days, required timeRange
    Joi.object({
      type: Joi.string().valid("permanent").required(),
      daysOfWeek: Joi.array()
        .items(Joi.number().integer().min(0).max(6))
        .default([]),
      timeRange: timeRangeSchema,
    }),
    // daysOfWeek: at least one day, required timeRange
    Joi.object({
      type: Joi.string().valid("daysOfWeek").required(),
      daysOfWeek: Joi.array()
        .items(Joi.number().integer().min(0).max(6))
        .min(1)
        .required(),
      timeRange: timeRangeSchema,
    }),
    // range: optional date (ISO), required timeRange
    Joi.object({
      type: Joi.string().valid("range").required(),
      date: Joi.date().iso().optional(),
      timeRange: timeRangeSchema,
    })
  )
  .allow(null);

// CREATE: do NOT require original_price / discount_percentage (server computes them)
const createSpecialMenuSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().allow("", null),
  discounted_price: Joi.number().precision(2).min(0).required(),
  photo_url: Joi.string().uri().allow("", null),
  restaurant_id: Joi.number().integer().required(),
  availability: availabilitySchema.optional(),
});

// UPDATE: partial; still do NOT accept/require original_price or discount_percentage from client
const updateSpecialMenuSchema = Joi.object({
  name: Joi.string().max(255),
  description: Joi.string().allow("", null),
  discounted_price: Joi.number().precision(2).min(0),
  photo_url: Joi.string().uri().allow("", null),
  availability: availabilitySchema,
  // accepted but ignored for auth (ownership is checked by id)
  restaurant_id: Joi.number().integer(),
}).min(1);

// DELETE: body can be empty; keep restaurant_id optional for backward compatibility
const deleteSpecialMenuSchema = Joi.object({
  restaurant_id: Joi.number().integer().optional(),
}).unknown(true);

module.exports = {
  createSpecialMenuSchema,
  updateSpecialMenuSchema,
  deleteSpecialMenuSchema,
};
