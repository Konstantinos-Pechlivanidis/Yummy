const Joi = require("joi");

const contactSchema = Joi.object({
  phone: Joi.string().max(50).allow("", null),
  email: Joi.string().email().allow("", null),
  socialMedia: Joi.object({
    facebook: Joi.string().uri().allow("", null),
    instagram: Joi.string().uri().allow("", null),
  }).optional(),
}).required();

const updateRestaurantSchema = Joi.object({
  // Only allow contact updates via this endpoint
  contact: contactSchema,
}).required();

module.exports = {
  updateRestaurantSchema,
};
