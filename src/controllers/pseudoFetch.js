let reqData = require('../../pseodoFetch/req.json');
let buhData = require('../../pseodoFetch/buh.json');
let analyticsData = require('../../pseodoFetch/analytics.json');

// редирект на страницу с формой ИНН и ОГРН
const redirect = (req, res) => {
  res.redirect('/form');
};
// рендер формы с ИНН и ОГРН
const showForm = (req, res) => {
  res.render('form');
};

// Результативная таблица
const showTable = async (req, res) => {
  // получаем данные из ИНН и ОГРН
  const { inn, ogrn } = req.body;

  if (inn === '2308268156' && ogrn === '1192375061152') {
    let answersArray = [];
    let tableData = [];

    // функция описывающая логику первого вопроса "Срок существования юр.лица либо ИП менее 6 месяцев"
    async function algorythmReq() {
      try {
        const data = reqData;
        let result = data[0].UL.legalName.date;
        const date = new Date(result);
        const dateNow = Date.now();
        const diffTime = Math.abs(dateNow - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        answersArray.push('нет');
        if (diffDays < 180) {
          return answersArray.push('да');
        } else {
          return answersArray.push('нет');
        }
      } catch (error) {
        console.log(error);
      }
    }

    // функция описывающая логику запроса "Наличие отрицательного финансового результата (убытка) по данным официальной отчетности на 31 декабря года/ненулевая декларация по ИП, предшествующего году предоставления Анкеты-заявки"
    async function algorythmBuh() {
      const data = buhData;
      const form1 = data[0].buhForms[0].form1;
      const form2 = data[0].buhForms[0].form2;
      let profitForm1 = 0;
      let profitForm2 = 0;
      let futureProfit = 0;

      form1.forEach((el) => {
        if (el.code === 1300) {
          profitForm1 = el.endValue;
        } else if (el.code === 1530) {
          futureProfit === el.endValue;
        }
      });
      if (profitForm1 + futureProfit <= 0) {
        answersArray.push('да');
      } else {
        answersArray.push('нет');
      }

      form2.forEach((el) => {
        if (el.code === 2400) {
          profitForm2 = el.endValue;
        }
      });
      if (profitForm2 > 0) {
        answersArray.push('нет');
      } else {
        answersArray.push('да');
      }
    }

    // функция описывающая логику запроса по ключевым кодам из документации КонтурAPI к данным analytics. Проверяет ответы на вопросы: "1)Наличие судебных разбирательств в качестве Ответчика в сумме не более 500 000 руб. и не более квартальной выручки по официальной отчетности для ООО/АО, 2)Наличие исполнительных производств, сумма которых превышает 30% среднемесячной выручки и прочих доходов по данным официальной отчетности за последний финансовый год (применимо для ООО/АО), 3)Наличие приостановлений / блокировок по счету, 4)Наличие заявлений о банкростве компании и/или ее руководителя, 5)Субьект МСП (Реестр субъектов малого и среднего предпринимательства)"
    async function algorythmAnalytics() {
      try {
        const data = analyticsData;
        const x = data[0].analytics;
        let result =
          x.m5004 === false || x.m5004 === undefined
            ? answersArray.push('нет')
            : answersArray.push('да');
        x.s2001 < 500000 && x.s2001 < x.s6006 / 4
          ? answersArray.push('нет')
          : answersArray.push('да');
        x.s1007 > (x.s6006 / 12) * 0.3
          ? answersArray.push('нет')
          : answersArray.push('да');
        x.m7010 === false || x.m7010 === undefined
          ? answersArray.push('нет')
          : answersArray.push('да');
        x.m7022 === false || x.m7022 === undefined
          ? answersArray.push('нет')
          : answersArray.push('да');
        x.d7023 ? answersArray.push('нет') : answersArray.push('да');
        return answersArray;
      } catch (error) {
        console.log(error);
      }
    }

    const questionsArray = [
      'Клиент не является резидентом Российской Федерации',
      'Срок существования юр.лица либо ИП менее 6 месяцев',
      'Наличие отрицательных чистых активов по данным на 31 декабря года, предшествующего году представления Анкеты-заявки',
      'Наличие отрицательного финансового результата (убытка) по данным официальной отчетности на 31 декабря года/ненулевая декларация по ИП, предшествующего году предоставления Анкеты-заявки',
      'Наличие задолженности перед федеральным бюджетом, бюджетами Российской Федерации, местными бюджетами и внебюджетными фондами более 1тыс.руб',
      'Наличие судебных разбирательств в качестве Ответчика в сумме не более 500 000 руб. и не более квартальной выручки по официальной отчетности для ООО/АО',
      'Наличие исполнительных производств, сумма которых превышает 30% среднемесячной выручки и прочих доходов по данным официальной отчетности за последний финансовый год (применимо для ООО/АО)',
      'Наличие приостановлений / блокировок по счету',
      'Наличие заявлений о банкростве компании и/или ее руководителя',
      'Субьект МСП (Реестр субъектов малого и среднего предпринимательства)',
    ];

    // итоговая функцияя объединяющая все функции и выводящаяя их результат
    async function algorythm() {
      await algorythmReq();
      await algorythmBuh();
      const answers = await algorythmAnalytics();

      for (let i = 0; i < questionsArray.length; i++) {
        tableData.push({ question: questionsArray[i], answer: answers[i] });
      }
      return tableData;
    }

    await algorythm();

    return res.render('table', { tableData });
  }
};

module.exports = { redirect, showForm, showTable };
