const express = require('express');

const formController = require('../controllers/pseudoFetch');

const router = express.Router();

router.get('/', formController.redirect);
// рендер страницы с формой ИНН и ОГРН
router.get('/form', formController.showForm);
// рендер страницы с результатами
router.post('/result', formController.showTable);

module.exports = router;
