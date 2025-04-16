// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    // Инициализация модального окна
    addModalToDOM();

    // Расчеты при загрузке страницы
    calculatePaybackPeriod();
    calculateROI();
    calculateOCF();

    // Добавляем обработчики для областей с результатами калькуляторов
    attachCalculatorResultListeners();

    // Инициализация состояния ROI калькулятора
    const isFirstYear = document.getElementById('roiFirstYear').checked;
    if (isFirstYear) {
        toggleRoiFirstYear(); // Установка правильного состояния при загрузке страницы
    }

    // Перемещаем кнопки карусели за пределы карусели
    repositionCarouselButtons();

    // Настройка сенсорного управления (свайпы)
    const carousel = document.querySelector('.calculator-carousel');
    let startX;
    let isSwiping = false;

    carousel.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        isSwiping = true;
    });

    carousel.addEventListener('touchmove', function (e) {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const diff = startX - currentX;

        // Предотвращаем скролл страницы при свайпе
        if (Math.abs(diff) > 5) {
            e.preventDefault();
        }
    }, { passive: false });

    carousel.addEventListener('touchend', function (e) {
        if (!isSwiping) return;
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        // Если свайп достаточно длинный
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Свайп влево - следующий слайд
                moveCarousel(1);
            } else {
                // Свайп вправо - предыдущий слайд
                moveCarousel(-1);
            }
        }

        isSwiping = false;
    });

    // Проверяем наличие элементов аккордеона
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    if (accordionHeaders.length > 0) {
        console.log('Аккордеон инициализирован, найдено заголовков:', accordionHeaders.length);
    }

    // Добавляем обработчик для заголовка анализа
    const analysisTitle = document.getElementById('analysisTitle');
    if (analysisTitle) {
        analysisTitle.addEventListener('click', toggleAnalysisVisibility);
        // Добавляем класс, указывающий на кликабельность
        analysisTitle.classList.add('toggleable');
    }
});

// Функция для перемещения кнопок карусели за пределы карусели
function repositionCarouselButtons() {
    const carousel = document.querySelector('.calculator-carousel');
    const calcSection = document.querySelector('.calc-section');

    if (carousel && calcSection) {
        // Находим кнопки
        const prevBtn = carousel.querySelector('.prev-btn');
        const nextBtn = carousel.querySelector('.next-btn');

        // Удаляем кнопки из текущего контейнера
        if (prevBtn) carousel.removeChild(prevBtn);
        if (nextBtn) carousel.removeChild(nextBtn);

        // Создаем новые кнопки с улучшенными стилями
        const newPrevBtn = document.createElement('button');
        newPrevBtn.className = 'carousel-btn prev-btn';
        newPrevBtn.innerHTML = '<img src="./images/left_arrow.png" alt="Назад" style="width:300%; height:300%;">';
        newPrevBtn.onclick = function () { moveCarousel(-1); };
        newPrevBtn.style.position = 'absolute';
        newPrevBtn.style.left = '30px';
        newPrevBtn.style.width = '40px';
        newPrevBtn.style.height = '40px';
        newPrevBtn.style.fontSize = '1.2rem';

        const newNextBtn = document.createElement('button');
        newNextBtn.className = 'carousel-btn next-btn';
        newNextBtn.innerHTML = '<img src="./images/right_arrow.png" alt="Назад" style="width:300%; height:300%;">';
        newNextBtn.onclick = function () { moveCarousel(1); };
        newNextBtn.style.position = 'absolute';
        newNextBtn.style.right = '30px';
        newNextBtn.style.width = '40px';
        newNextBtn.style.height = '40px';
        newNextBtn.style.fontSize = '1.2rem';

        // Устанавливаем родительский контейнер в position: relative
        // для правильного позиционирования абсолютно позиционированных кнопок
        calcSection.style.position = 'relative';

        // Добавляем кнопки в новый контейнер
        calcSection.appendChild(newPrevBtn);
        calcSection.appendChild(newNextBtn);
    }
}

// Переменные для карусели
let currentSlide = 0;
const totalSlides = 3; // Было 4, теперь 3, так как объединили два калькулятора ROI

// Функция для обновления отображения карусели
function updateCarousel() {
    const track = document.getElementById('calculatorCarousel');
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Обновление индикаторов
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// Функция для перемещения карусели
function moveCarousel(direction) {
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    updateCarousel();
}

// Функция для показа конкретного слайда
function showSlide(slideIndex) {
    currentSlide = slideIndex;
    updateCarousel();
}// Функция для выбора правильного метода расчета в зависимости от состояния чекбокса
function recalculateROIBasedOnCheckbox() {
    const isFirstYear = document.getElementById('roiFirstYear').checked;

    if (isFirstYear) {
        calculateROIFirstYear();
    } else {
        calculateROI();
    }
}

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const resultDiv = document.getElementById('result');
const analysisResultsDiv = document.getElementById('analysisResults');
const analysisTitleDiv = document.getElementById('analysisTitle');
const economicScoreDiv = document.getElementById('economicScore');
const legalScoreDiv = document.getElementById('legalScore');
const economicFactorsDiv = document.getElementById('economicFactors');
const legalFactorsDiv = document.getElementById('legalFactors');
const downloadReportBtn = document.getElementById('downloadReport');

let totalFilesUploaded = 0;
let validFilesUploaded = 0;
let invalidFilesUploaded = 0;

// Сохраняем изначальное содержимое области загрузки
const originalUploadAreaContent = uploadArea.innerHTML;
const originalBackgroundColor = '#f0f8ff';

let currentFileName = '';
let isAnalysisVisible = true; // Флаг для отслеживания видимости области анализа

// Функция для переключения видимости области анализа
function toggleAnalysisVisibility() {
    const analysisResults = document.getElementById('analysisResults');

    // Проверка состояния и переключение
    isAnalysisVisible = !isAnalysisVisible;

    if (isAnalysisVisible) {
        analysisResults.style.display = 'block';
        // Убираем класс "collapsed" при открытии
        analysisTitleDiv.classList.remove('collapsed');
    } else {
        analysisResults.style.display = 'none';
        // Добавляем класс "collapsed" при закрытии
        analysisTitleDiv.classList.add('collapsed');
    }
}

// Допустимые типы файлов
const allowedFileTypes = [
    'application/pdf', // PDF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
];

// Функция для сброса области загрузки к изначальному состоянию
function resetUploadArea() {
    uploadArea.innerHTML = originalUploadAreaContent;
    uploadArea.style.backgroundColor = originalBackgroundColor;
}

// Обработка перетаскивания файла
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '#e0f7fa';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.backgroundColor = originalBackgroundColor;
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    // Сначала сбрасываем область загрузки к изначальному состоянию
    resetUploadArea();
    const file = e.dataTransfer.files[0]; // Получение файла
    handleFile(file); // Обработка файла
});

// Обработка выбора файла через диалоговое окно
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    // Сначала сбрасываем область загрузки к изначальному состоянию
    resetUploadArea();
    const file = e.target.files[0]; // Получение файла
    handleFile(file); // Обработка файла
});

// Функция для проверки типа файла
function isValidFileType(file) {
    if (!file) return false;

    if (allowedFileTypes.includes(file.type)) {
        return true;
    }

    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.pdf') || fileName.endsWith('.docx');
}

// Функция-заглушка для проверки файла на корректность - убрана задержка
function checkFileValidity(file) {
    return new Promise((resolve) => {
        resultDiv.innerHTML = 'Проверка файла на корректность...';
        // Убираем задержку, выполняем мгновенно
        uploadArea.style.backgroundColor = '#CCFFCC';
        resolve(true); // Всегда возвращаем успешный результат
    });
}

// Функция для отображения оценки в виде изображения
function displayScore(element, score) {
    // Очищаем текущее содержимое
    element.innerHTML = '';

    // Определяем имя файла изображения в зависимости от оценки
    let imageSrc = '';
    if (score === 1) {
        imageSrc = './images/rating1.png';
    } else if (score === 2) {
        imageSrc = './images/rating2.png';
    } else if (score === 3) {
        imageSrc = './images/rating3.png';
    }

    // Создаем изображение
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = 'Оценка ' + score;

    // Добавляем изображение в контейнер
    element.appendChild(img);
    element.className = 'score score-info';
}

// Функция для создания строки с экономическим фактором
function createEconomicFactorElement(factor, value) {
    const factorElement = document.createElement('div');
    factorElement.className = 'factor-item';

    // Добавляем название фактора
    const factorName = document.createElement('span');
    factorName.textContent = factor;
    factorElement.appendChild(factorName);
    
    if ((factor === 'Роялти' && value >= 35) || (factor === 'Паушальный взнос' && value >= 5000000) || (factor === 'Максимальный штраф' && value >= 500000)) {
        factorElement.classList.add('factor-negative');
    } else if ((factor === 'Роялти' && value < 15) || (factor === 'Паушальный взнос' && value < 1000000) || (factor === 'Максимальный штраф' && value < 300000)) {
        factorElement.classList.add('factor-positive');
    }
    // Добавляем результат с форматированием
    const factorResult = document.createElement('span');
    if (factor === 'Роялти') {
        factorResult.textContent = value + '%';
        title = 'В качестве роялти признают плату за использование долгосрочных активов организации, в частности патентов, торговых марок, авторских прав и компьютерного программного обеспечения. Также роялти определяют как периодические выплаты за использование патента и иных объектов интеллектуальной собственности, выплачиваемые в виде процента от стоимости проданных товаров и услуг, при производстве которых использовались патенты, авторские права и др.';
        href = 'https://www.consultant.ru/cons/cgi/online.cgi?req=doc&base=LAW&n=493202&dst=102452&cacheid=24EED9FF0BD3AC0ED6A9CC759FFD63CE&mode=splus&rnd=ptx86g#WbIqWiUXQAEV4gV5';
    } else if (factor == 'Паушальный взнос') {
        factorResult.textContent = value.toLocaleString('ru-RU') + ' руб.';
        title = 'Паушальный взнос в нормативных правовых актах РФ определяется как выплата по передаче прав на франшизу. Минэкономразвития России от 10.07.2017 N 338).';
        href = 'https://www.consultant.ru/cons/cgi/online.cgi?req=doc&base=LAW&n=493202&dst=102452&cacheid=24EED9FF0BD3AC0ED6A9CC759FFD63CE&mode=splus&rnd=ptx86g#WbIqWiUXQAEV4gV5';
    } else if (factor == 'Максимальный штраф') {
        factorResult.textContent = value.toLocaleString('ru-RU') + ' руб.';
        title = 'На случай неисполнения или ненадлежащего исполнения обязательства, в частности при просрочке исполнения, законом или договором может быть предусмотрена обязанность должника уплатить кредитору определенную денежную сумму (неустойку), размер которой может быть установлен в твердой сумме - штраф.';
        href = 'https://www.consultant.ru/cons/cgi/online.cgi?req=doc&base=LAW&n=482692&dst=101618&cacheid=0BA096671BE25289ADD4E9786DFB53CA&mode=splus&rnd=loDpWiUuqpcpfiDV1#wcwpWiUzEkbieX87';
    }
    factorElement.appendChild(factorResult);

    // Добавляем ссылку с обработчиком для открытия модального окна
    const factorLink = document.createElement('a');
    factorLink.href = href;
    factorLink.title = title;
    factorLink.textContent = 'Узнать';
    // factorLink.setAttribute('data-factor', factor);
    factorLink.target = '_blank';
    factorElement.appendChild(factorLink);

    return factorElement;
}

// Функция для создания строки с юридическим фактором
function createLegalFactorElement(question, value) {
    const factorElement = document.createElement('div');
    factorElement.className = 'factor-item';
    console.log(value)
    // Добавляем класс в зависимости от значения
    if (value === false) {
        factorElement.classList.add('factor-negative');
    } else if (value === true) {
        factorElement.classList.add('factor-positive');
    }

    // Формируем утверждение и ссылки на основе вопроса и значения
    let statement = '';
    let href = '';

    if (question === 'Не является ли документ лицензионным соглашением?') {
        statement = value === true
            ? 'Документ не является лицензионным соглашением'
            : 'Документ является лицензионным соглашением';
        href = 'https://www.consultant.ru/cons/cgi/online.cgi?req=doc&base=LAW&n=166145&dst=15&field=134&rnd=lb7JfQ';
        title = `Договор франшизы в отличие от лицензионного договора дает возможность использовать не один определенный объект интеллектуальной собственности, а комплекс объектов исключительных прав`;
    } else if (question === 'Отсутствует ли одностороннее расторжение без объяснения причин?') {
        statement = value === true
            ? 'Правообладатель не вправе расторгнуть договор без объяснения причин'
            : 'Правообладатель вправе расторгнуть договор без объяснения причин';
        title = `Если в договоре предусмотрено право на отказ, то оно может быть реализовано по-разному, если это не запрещено законом (п. 4 ст. 421 ГК РФ): отказ может быть мотивированным - связанным с нарушением договора контрагента или немотивированным - при котором отказаться от исполнения договора можно в любое время без объяснения причин`
        href = 'https://login.consultant.ru/link/?req=doc&base=LAW&n=482692&dst=101994&date=09.04.2025&demo=2';
    } else if (question === 'Даются ли Пользователю права на товарный знак?') {
        statement = value === true
            ? 'Пользователю даются права на товарный знак'
            : 'Пользователю не даются права на товарный знак';
        title = `По договору коммерческой концессии правообладатель обязуется предоставить пользователю за вознаграждение на срок или без указания срока право использовать в предпринимательской деятельности пользователя комплекс принадлежащих правообладателю исключительных прав, включающий право на товарный знак, знак обслуживания, а также права на другие предусмотренные договором объекты исключительных прав, в частности на коммерческое обозначение, секрет производства (ноу-хау) (п.1 ст.1027 ГК РФ)`
        href = 'https://login.consultant.ru/link/?req=doc&base=LAW&n=493202&dst=15&date=09.04.2025&demo=2';
    } else if (question === 'Отсутствует ли автоматическое расторжение?') {
        statement = value === true
            ? 'Отсутствует автоматическое расторжение договора'
            : 'Присутствует автоматическое расторжение договора';
        title = 'Автоматическое прекращение договора коммерческой концессии возможно в двух случаях, прямо предусмотренных законом.  Во-первых, когда  одну из сторон суд признал банкротом. Во-вторых, истек срок действия исключительного права на товарный знак.';
        href = 'https://www.consultant.ru/cons/cgi/online.cgi?req=doc&base=LAW&n=481313&dst=101559';
    } else if (question === 'Отсутствует ли запрет конкуренции?') {
        statement = value === true
            ? 'Отсутствует запрет конкуренции'
            : 'Присутствует запрет конкуренции';
        title = 'Вы можете включить в договор условия, которые ограничивают действия сторон договора. Примерный перечень ограничений есть в п. 1 ст. 1033 ГК РФ.'
        href = 'https://login.consultant.ru/link/?req=doc&base=LAW&n=493202&dst=77&date=09.04.2025&demo=2';    
    } else if (question === 'Имееется ли государственная регистрация?') {
        statement = value === true
            ? 'Присутствует государственная регистрация'
            : 'Государственная регистрация отсутствует';
        title = 'Обратите внимание, что регистрации подлежит не сам договор коммерческой концессии, а предоставление по нему права использовать комплекс исключительных прав правообладателя в предпринимательской деятельности пользователя. Без регистрации предоставление права использования считается несостоявшимся (п. 2 ст. 1028 ГК РФ).'
        href = 'https://login.consultant.ru/link/?req=doc&base=LAW&n=493202&dst=171&date=09.04.2025&demo=2';
    } else if (question === 'Указан ли размер вознаграждения?') {
        statement = value === true
            ? 'Указан размер вознаграждения'
            : 'Не указан размер вознаграждения';
        title = 'Обязательно укажите размер вознаграждения Правообладателя или установите, как его определить. Без этого условия договор по общему правилу считается незаключенным (п. п. 1, 4 ст. 1027, п. 5 ст. 1235 ГК РФ).'
        href = 'https://cloud.consultant.ru/cloud/cgi/online.cgi?req=doc&base=LAW&n=493202&dst=16&field=134&rnd=Zu6paA';
    } else if (question === 'Указан порядок подачи документов?') {
        statement = value === true
            ? 'Указан порядок подачи документов'
            : 'Не указан порядок подачи документов?';
        title = 'Регистрацию обеспечивает правообладатель, если договором не предусмотрено иное (п. 2 ст. 1031 ГК РФ). Вместе с тем в регистрации не обязательно откажут, если документы подаст пользователь или, напротив, правообладатель, когда договором такая обязанность возложена на пользователя (п. 3.4.10 Рекомендаций по вопросам проверки договоров о распоряжении исключительным правом). Предоставление права зарегистрируют (или откажут в регистрации, если для этого будут основания) в срок не более 45 рабочих дней со дня, когда необходимые документы поступят в Роспатент. Этот срок в ряде случаев может быть увеличен (п. п. 14, 15 Административного регламента по регистрации распоряжения по договору исключительным правом, п. 17 Правил регистрации распоряжения исключительным правом).';
        href = 'https://login.consultant.ru/link/?req=doc&base=LAW&n=493202&dst=172&field=134&date=15.04.2025';
    } else if (question === 'Является ли Правообладатель юридическим лицом?') {
        statement = value === true
            ? 'Правообладатель является юридическим лицом'
            : 'Правообладатель не является юридическим лицом';
        title = 'Сторонами по договору коммерческой концессии могут быть коммерческие организации и граждане, зарегистрированные в качестве индивидуальных предпринимателей (п.3 ст. 1027 ГК РФ)'
        href = 'https://login.consultant.ru/link/?req=doc&base=LAW&n=493202&dst=102437&date=09.04.2025&demo=2';
    } else if (question === 'Указаны ли положения о претензионном порядке?') {
        statement = value === true
            ? 'Указаны положения о претензионном порядке'
            : 'Не указаны положения о претензионном порядке';
        title = `Если вы не включите условие о претензионном порядке, то на разрешение арбитражного суда можно передать (ч. 5 ст. 4 АПК РФ): 
                1)спор о взыскании денежных средств - только по истечении 30 календарных дней со дня направления претензии, если иные срок и (или) порядок не установлены законом; 
                2)иные возникшие из договора споры - без соблюдения досудебного порядка, только если такой порядок не установлен федеральным законом.`;
        href = 'https://cloud.consultant.ru/cloud/cgi/online.cgi?req=doc&base=CJI&n=118813&dst=100016&field=134&rnd';
    } else if (question === 'Указан ли срок действия договора?') {
        statement = value === true
            ? 'Указан срок действия договора'
            : 'Не указан срок действия договора';
        title = 'Если вы не укажете срок действия договора, он будет действовать 5 лет (п. 4 ст. 1027, п. 4 ст. 1235 ГК РФ).'
        href = 'https://login.consultant.ru/link/?req=doc&base=LAW&n=493202&dst=16&date=09.04.2025&demo=2';
    } else if (question === 'Указан ли номер свидетельства правообладателя?') {
        statement = value === true
            ? 'Указан номер свидетельства правообладателя'
            : 'Не указан номер свидетельства правообладателя';
        title = "Без указания номера свидетельства правообладателя и перечня товаров, в отношении которых пользователь вправе использовать товарный знак, договор по общему правилу может быть признан незаключенным (п. п. 1, 3 ст. 432, п. 4 ст. 1027, пп. 1 п. 6 ст. 1235, п. 1.1 ст. 1489 ГК РФ). Если какой-то из способов не будет указан в договоре, пользователь не сможет его применять (п. 4 ст. 1027, п. 1 ст. 1235 ГК РФ).";
        href = 'https://login.consultant.ru/link/?req=doc&base=LAW&n=482692&dst=102049&date=09.04.2025&demo=2';
    }
    // Добавляем утверждение в колонку "Фактор"
    const factorStatement = document.createElement('span');
    factorStatement.textContent = statement;
    factorElement.appendChild(factorStatement);

    // Добавляем ссылку или дропдаун с множественными ссылками в колонку "Ссылка"
    const factorLink = document.createElement('a');
    factorLink.href = href;
    factorLink.title = title;
    factorLink.textContent = 'Узнать';
    factorLink.target = '_blank';
    factorElement.appendChild(factorLink);

    return factorElement;
}

// Функция для заполнения списка экономических факторов
function populateEconomicFactors(container, factors) {
    container.innerHTML = '';

    for (const [factor, value] of Object.entries(factors)) {
        container.appendChild(createEconomicFactorElement(factor, value));
    }
}

// Функция для заполнения списка юридических факторов
function populateLegalFactors(container, factors) {
    container.innerHTML = '';

    // Обновляем заголовок для юридической таблицы - теперь уже не нужно
    // так как структура сделана правильно в HTML

    for (const [question, value] of Object.entries(factors)) {
        container.appendChild(createLegalFactorElement(question, value));
    }

    // Добавляем обработчики событий для всех дропдаунов с ссылками
    document.querySelectorAll('.link-dropdown .main-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Закрываем все дропдауны при клике вне них
    document.addEventListener('click', function (e) {
        if (!e.target.matches('.main-link')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });
}

// Функция для создания и отображения индикатора загрузки
function showLoadingIndicator() {
    const loadingHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Пожалуйста, подождите. Анализ договора может занять некоторое время...</p>
        </div>
    `;
    resultDiv.innerHTML = loadingHTML;
    return true;
}

// Выносим обработчик в глобальную область
let currentReportData = null;

// Добавляем обработчик один раз при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    downloadReportBtn.addEventListener('click', async () => {
        if (!currentReportData) return;
        
        const { jsPDF } = window.jspdf;
        const content = document.createElement('div');
        content.style.fontFamily = 'Roboto, sans-serif';
        content.style.padding = '20px';
        content.innerHTML = `
            <h1 style="text-align: center;">Отчет по анализу файла</h1>
            <hr>
            <p><strong>Имя файла:</strong> ${currentReportData.fileName}</p>
            <br>
            <h2>${currentReportData.title}</h2>
            <br>
            <h3>Оценка юридической чистоты: ${currentReportData.legalScore}/3</h3>
            <h3>Оценка экономической выгоды: ${currentReportData.economicScore}/3</h3>
            <br>
            ${currentReportData.finalContent}
        `;

        document.body.appendChild(content);
        const canvas = await html2canvas(content);
        document.body.removeChild(content);

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Отчет_${currentReportData.fileName.replace(/\.[^/.]+$/, "")}.pdf`);
    });
});

function analyzeFile(file) {
    return new Promise((resolve, reject) => {
        showLoadingIndicator();
        const formData = new FormData();
        formData.append('file', file);

        fetch('http://127.0.0.1:5000/analyze', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(30000)
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сети: ' + response.statusText);
            return response.json();
        })
        .then(data => {
            resultDiv.innerHTML = 'Анализ файла...';

            // Обновляем текущие данные отчета
            currentReportData = {
                fileName: currentFileName,
                title: analysisTitleDiv.textContent,
                legalScore: data.legalScore,
                economicScore: data.economicScore,
                finalContent: data.final,
                economicFactors: data.economicFactors
            };

            displayScore(economicScoreDiv, data.economicScore);
            displayScore(legalScoreDiv, data.legalScore);
            populateEconomicFactors(economicFactorsDiv, data.economicFactors);
            populateLegalFactors(legalFactorsDiv, data.legalFactors);

            analysisResultsDiv.style.display = 'block';

            if (data.economicScore === 1 || data.legalScore === 1) {
                analysisTitleDiv.textContent = 'Результат: Крайне не рекомендуется использовать этот договор';
            } else if (data.economicScore === 2 || data.legalScore === 2) {
                analysisTitleDiv.textContent = 'Результат: Договор рекомендуется немного изменить';
            } else {
                analysisTitleDiv.textContent = 'Результат: С юридической стороны договор корректен, а с экономической — рентабелен';
            }

            resolve({ 
                success: true, 
                message: 'Файл успешно проанализирован', 
                economicScore: data.economicScore, 
                legalScore: data.legalScore 
            });
        })
        .catch(error => reject('Ошибка при обработке файла: ' + error));

        isAnalysisVisible = true;
        analysisTitleDiv.classList.remove('collapsed');
    });
}


document.getElementById('checkCounterparty').addEventListener('click', function (e) {
    e.preventDefault();
    const modal = document.getElementById('checkModal');
    modal.style.display = 'block';
});

document.getElementById('closeCheckModal').addEventListener('click', function () {
    document.getElementById('checkModal').style.display = 'none';
});

window.addEventListener('click', function (e) {
    const modal = document.getElementById('checkModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Обновленная функция для обработки файла
function handleFile(file) {
    if (!file) return;

    // Сохраняем имя файла
    currentFileName = file.name;

    // Сначала проверяем тип файла
    if (!isValidFileType(file)) {
        resultDiv.innerHTML = 'Ошибка: Пожалуйста, загрузите только файлы PDF или DOCX.';
        // Скрываем результаты, если файл некорректен
        analysisTitleDiv.style.display = 'none';
        analysisResultsDiv.style.display = 'none';
        return;
    }

    // Отображаем загруженный файл в области загрузки
    uploadArea.innerHTML = `<p>Файл: ${file.name}</p>`;
    uploadArea.style.backgroundColor = '#e0f7fa';

    // Показываем начало обработки
    resultDiv.innerHTML = 'Проверка файла на корректность...';

    // Скрываем блоки анализа перед началом обработки
    analysisTitleDiv.style.display = 'none';
    analysisResultsDiv.style.display = 'none';

    // Используем Promise для последовательной обработки
    checkFileValidity(file)
        .then(isValid => {
            if (isValid) {
                // Обновляем состояние UI перед началом анализа
                uploadArea.style.backgroundColor = '#CCFFCC';
                return analyzeFile(file);
            } else {
                throw new Error('Файл некорректен');
            }
        })
        .then(result => {
            console.log("Анализ завершен успешно:", result);

            resultDiv.innerHTML = `Анализа файла "${currentFileName}" завершен успешно!`
            
            // Явно показываем заголовок
            // analysisTitleDiv.textContent = `Анализ файла "${currentFileName}"`;
            analysisTitleDiv.style.display = 'block';

            // Явно показываем блок результатов
            analysisResultsDiv.style.display = 'block';

            // Добавляем обработчики для кнопок "Узнать" в экономической экспертизе
            // attachEconomicFactorListeners();

            // Прокручиваем страницу к результатам
            analysisResultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(error => {
            console.error('Ошибка:', error);
            resultDiv.innerHTML = `Произошла ошибка при обработке файла: ${error.message}`;
            // Скрываем блоки анализа при ошибке
            analysisTitleDiv.style.display = 'none';
            analysisResultsDiv.style.display = 'none';
        });

    // Отправляем событие загрузки файла
    sendEvent('file_upload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
    });
}

function sendEvent(eventName, data = {}) {
    fetch('http://localhost:3000/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: eventName,
            data,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            page: window.location.pathname,
            referrer: document.referrer,
        })
    }).catch(err => console.error('Ошибка при отправке события:', err));
}

// Код для модального окна экономической экспертизы

// Функция для добавления модального окна в DOM
function addModalToDOM() {
    // Проверяем, что модальное окно еще не существует
    if (document.getElementById('economicModal')) {
        return document.getElementById('economicModal');
    }

    const modalElement = document.createElement('div');
    modalElement.innerHTML = `
        <div id="economicModal" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3 id="modalTitle">Информация</h3>
                <div id="modalContent"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modalElement.firstElementChild);

    // Добавляем обработчики для закрытия модального окна
    const modal = document.getElementById('economicModal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.onclick = function () {
        modal.style.display = "none";
    }

    // Закрытие по клику вне модального окна
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Закрытие по клавише Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = "none";
        }
    });

    return modal;
}

// Функция для открытия модального окна
// function openEconomicModal(factor) {
//     const modal = document.getElementById('economicModal') || addModalToDOM();
//     const modalTitle = modal.querySelector('#modalTitle');
//      const modalContent = modal.querySelector('#modalContent');

//     // Устанавливаем заголовок и содержимое
//     modalTitle.textContent = factor;
//     if (factor === 'Роялти') {
//         modalContent.textContent = `Это регулярный (обычно ежемесячный) платёж, который вы платите владельцу франшизы за право пользоваться его брендом и получать поддержку. Обычно рассчитывается как процент от вашей выручки.`;
//     } else if (factor === 'Паушальный взнос') {
//         modalContent.textContent = `Это разовый платёж, который вы платите в начале, чтобы купить право открыть франшизу и использовать бренд, бизнес-модель и поддержку франчайзера.`;
//     } else if (factor === 'Максимальный штраф') {
//         modalContent.textContent = `Предусмотрены за нарушение условий договора франчайзинга, например, несоблюдение стандартов бренда, просрочку платежей или несанкционированное раскрытие коммерческой тайны.`;
//     } else {
//         modalContent.textContent = '';
//     }

//     // Отображаем модальное окно
//     modal.style.display = "block";
// }

// Функция для добавления обработчиков к существующим кнопкам
// function attachEconomicFactorListeners() {
//     document.querySelectorAll('.analysis-column:last-child .factor-item a').forEach(link => {
//         link.onclick = function (e) {
//             e.preventDefault();
//             const factor = this.closest('.factor-item').querySelector('span:first-child').textContent;
//             openEconomicModal(factor);
//         };
//     });
// }

// Функция для открытия модального окна с информацией о калькуляторе
function openCalculatorModal(calculator) {
    const modal = document.getElementById('economicModal') || addModalToDOM();
    const modalTitle = modal.querySelector('#modalTitle');
    const modalContent = modal.querySelector('#modalContent');

    switch (calculator) {
        case 'payback':
            modalTitle.textContent = 'Срок окупаемости';
            modalContent.innerHTML = `
                <p>Это время, за которое вы вернёте свои инвестиции. Рассчитывается как сумма вложений, делённая на ежемесячную прибыль. Чем короче срок окупаемости — тем быстрее бизнес начнёт приносить прибыль.</p>
            `;
            break;
        case 'roi':
            modalTitle.textContent = 'Рентабельность инвестиций (ROI)';
            modalContent.innerHTML = `
                <p>Показатель, отражающий, насколько прибыльна инвестиция. Рассчитывается как соотношение дохода к вложениям и выражается в процентах. Высокий ROI говорит о хорошей доходности проекта.</p>
            `;
            break;
        case 'ocf':
            modalTitle.textContent = 'Операционный денежный поток (OCF)';
            modalContent.innerHTML = `
                <p>OCF — это деньги, которые остаются у бизнеса после оплаты всех операционных расходов. Помогает оценить реальную платежеспособность компании, независимо от инвестиций и кредитов.</p>
            `;
            break;
        default:
            modalTitle.textContent = 'Информация';
            modalContent.innerHTML = '<p>Описание калькулятора недоступно.</p>';
            break;
    }

    // Отображаем модальное окно
    modal.style.display = "block";
}

// Добавляем обработчики для результатов калькуляторов
function attachCalculatorResultListeners() {
    // Для калькулятора срока окупаемости
    const poResult = document.querySelector('#poResult').parentElement.parentElement;
    poResult.style.cursor = 'pointer';
    poResult.addEventListener('click', function () {
        openCalculatorModal('payback');
    });

    // Для калькулятора ROI
    const roiResult = document.querySelector('#roiResult').parentElement.parentElement;
    roiResult.style.cursor = 'pointer';
    roiResult.addEventListener('click', function () {
        openCalculatorModal('roi');
    });

    // Для калькулятора OCF
    const ocfResult = document.querySelector('#ocfResult').parentElement.parentElement;
    ocfResult.style.cursor = 'pointer';
    ocfResult.addEventListener('click', function () {
        openCalculatorModal('ocf');
    });
}

// Функция для управления аккордеоном FAQ
function toggleAccordion(header) {
    // Получаем родительский элемент (весь аккордеон-айтем)
    const item = header.parentElement;

    // Если текущий элемент уже открыт, просто закрываем его
    if (item.classList.contains('active')) {
        item.classList.remove('active');
        return;
    }

    // Закрываем все открытые элементы аккордеона
    const allItems = document.querySelectorAll('.accordion-item');
    allItems.forEach(accordionItem => {
        accordionItem.classList.remove('active');
    });

    // Открываем текущий элемент
    item.classList.add('active');
}

// Функция для переключения отображения поля паушального взноса
function toggleRoiFirstYear() {
    const isFirstYear = document.getElementById('roiFirstYear').checked;
    const franchiseFeeRow = document.getElementById('franchiseFeeRow');

    console.log("Переключение режима ROI. За первый год:", isFirstYear);

    if (isFirstYear) {
        franchiseFeeRow.style.display = 'flex';
        // Автоматический пересчет при включении чекбокса
        calculateROIFirstYear();
    } else {
        franchiseFeeRow.style.display = 'none';
        // Автоматический пересчет при выключении чекбокса
        calculateROI();
    }
}

// Обычная функция для расчета ROI (Рентабельность инвестиций)
function calculateROI() {
    const income = parseFloat(document.getElementById('roiIncome').value);
    const investment = parseFloat(document.getElementById('roiInvestment').value);

    // Обычный расчет ROI: (Доход от вложений – Вложения) / Вложения * 100%
    const roi = ((income - investment) / investment) * 100;
    console.log("Расчет обычного ROI:");
    console.log("Доход:", income, "Вложения:", investment);
    console.log("Формула: ((", income, "-", investment, ") /", investment, ") * 100 =", roi);

    document.getElementById('roiResult').textContent = roi.toLocaleString('ru-RU', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    });
}

function calculateOCF() {
    const ebit = parseFloat(document.getElementById('ocfEBIT').value);
    const depreciation = parseFloat(document.getElementById('ocfDepreciation').value);
    const taxes = parseFloat(document.getElementById('ocfTaxes').value);

    // OCF = EBIT + Амортизация − Налоги
    const ocf = ebit + depreciation - taxes;

    document.getElementById('ocfResult').textContent = ocf.toLocaleString('ru-RU', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    });
}

function calculatePaybackPeriod() {
    const investment = parseFloat(document.getElementById('poInvestment').value);
    const franchiseFee = parseFloat(document.getElementById('poFranchiseFee').value);
    const royalty = parseFloat(document.getElementById('poRoyalty').value);
    const monthlyProfit = parseFloat(document.getElementById('poMonthlyProfit').value);

    // Срок окупаемости = размер вложений (все планируемые затраты+паушальный взнос+роялти) / планируемая прибыль (за месяц)
    const totalInvestment = investment + franchiseFee + royalty;
    const paybackPeriod = totalInvestment / monthlyProfit;

    document.getElementById('poResult').textContent = paybackPeriod.toLocaleString('ru-RU', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
    });
}

// Специальная функция для расчета ROI за первый год
function calculateROIFirstYear() {
    const income = parseFloat(document.getElementById('roiIncome').value);
    const investment = parseFloat(document.getElementById('roiInvestment').value);
    const franchiseFee = parseFloat(document.getElementById('roiFranchiseFee').value) || 0;

    // Расчет ROI за первый год: (Доход от вложений – Вложения + паушальный взнос) / Вложения * 100%
    const roi = ((income - investment - franchiseFee) / investment) * 100;
    console.log("Расчет ROI за первый год:");
    console.log("Доход:", income, "Вложения:", investment, "Паушальный взнос:", franchiseFee);
    console.log("Формула: ((", income, "-", investment, "-", franchiseFee, ") /", investment, ") * 100 =", roi);

    document.getElementById('roiResult').textContent = roi.toLocaleString('ru-RU', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    });
}