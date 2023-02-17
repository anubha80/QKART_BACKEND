const express = require("express");
const validate = require("../../middlewares/validate");
const authValidation = require("../../validations/auth.validation");
const authController = require("../../controllers/auth.controller");

const router = express.Router();


const validateUser = validate(authValidation.register);
const validateLogin = validate(authValidation.login);

router.post('/register', validateUser, authController.register);

router.post('/login', validateLogin , authController.login);

module.exports = router;
