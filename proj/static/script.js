// Функция для выбора правильного метода расчета в зависимости от состояния чекбокса
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

    // Добавляем результат с форматированием
    const factorResult = document.createElement('span');
    if (factor === 'Роялти') {
        factorResult.textContent = value + '%';
    } else {
        factorResult.textContent = value.toLocaleString('ru-RU') + ' руб.';
    }
    factorElement.appendChild(factorResult);

    // Добавляем ссылку
    const factorLink = document.createElement('a');
    factorLink.href = "#";
    factorLink.textContent = 'Ссылка';
    factorElement.appendChild(factorLink);

    return factorElement;
}

// Функция для создания строки с юридическим фактором
function createLegalFactorElement(question, value) {
    const factorElement = document.createElement('div');
    factorElement.className = 'factor-item';

    // Формируем утверждение и ссылки на основе вопроса и значения
    let statement = '';
    let href = '';
    let multipleLinks = null;

    if (question === 'Правообладатель вправе расторгнуть договор без объяснения причин?') {
        statement = value === 1
            ? 'Правообладатель вправе расторгнуть договор без объяснения причин'
            : 'Правообладатель не вправе расторгнуть договор без объяснения причин';

        // Для этого фактора создаем мультиссылку
        multipleLinks = [
            { text: 'Ст. 10 ГК', url: 'https://www.consultant.ru/document/cons_doc_LAW_5142/62129e15ab0e6008725f43d63284aef0bb12c2cf/' },
            { text: 'Ст. 432 ГК', url: 'https://www.consultant.ru/document/cons_doc_LAW_5142/adbefccc8d538d42038164bb81d886c76e719d63/' },
            { text: 'Ст. 1033 ГК', url: 'https://www.consultant.ru/document/cons_doc_LAW_9027/fee922b3cd2e5c6f09bdc7372d2f857da2a2f64d/' }
        ];
    } else if (question === 'Даются ли Пользователю права на товарный знак?') {
        statement = value === 1
            ? 'Пользователю даются права на товарный знак'
            : 'Пользователю не даются права на товарный знак';
        href = 'https://www.consultant.ru/document/cons_doc_LAW_9027/49c2afdf04c1ba13e815aa8b44287cd4b6cac9f5/';
    } else if (question === 'Является ли Правообладатель юридическим лицом?') {
        statement = value === 1
            ? 'Правообладатель является юридическим лицом'
            : 'Правообладатель не является юридическим лицом';
        href = 'https://www.consultant.ru/document/cons_doc_LAW_9027/49c2afdf04c1ba13e815aa8b44287cd4b6cac9f5/';
    }

    // Добавляем утверждение в колонку "Фактор"
    const factorStatement = document.createElement('span');
    factorStatement.textContent = statement;
    factorElement.appendChild(factorStatement);

    // Добавляем ссылку или дропдаун с множественными ссылками в колонку "Ссылка"
    if (multipleLinks) {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'link-dropdown';

        const mainLink = document.createElement('a');
        mainLink.href = "#";
        mainLink.textContent = 'Ссылки';
        mainLink.className = 'main-link';
        linkContainer.appendChild(mainLink);

        const dropdownContent = document.createElement('div');
        dropdownContent.className = 'dropdown-content';

        multipleLinks.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.textContent = link.text;
            linkElement.target = '_blank';
            dropdownContent.appendChild(linkElement);
        });

        linkContainer.appendChild(dropdownContent);
        factorElement.appendChild(linkContainer);
    } else {
        const factorLink = document.createElement('a');
        factorLink.href = href;
        factorLink.textContent = 'Ссылка';
        factorLink.target = '_blank';
        factorElement.appendChild(factorLink);
    }

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

// Функция-заглушка для анализа файла - убрана задержка
function analyzeFile(file) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file); // Добавляем файл в FormData

        fetch('http://127.0.0.1:5000/analyze', { // Убедитесь, что этот URL соответствует вашему серверу
            method: 'POST',
            body: formData // Отправляем FormData с файлом
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сети: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            resultDiv.innerHTML = 'Анализ файла...';

            // Здесь должна быть заглушка словаря с данными анализа
            const economicFactors = {
                'Роялти': 5,
                'Паушальный взнос': 0,
                'Штраф': 0
            };

            const legalFactors = {
                "Правообладатель не вправе расторгнуть договор без объяснения причин?" : true,
                "Даются ли Пользователю права на товарный знак?" : true,
                "Является ли Правообладатель юридическим лицом?" : true,
                "Имееется ли государственная регистрация?": true,
                "Это лицензионное соглашение?": true,
                "Указан порядок подачи документов в Роспатент?": true,
                "Отсутствует ли запрет конкуренции?": true,
                "Отсутсвует ли автоматическое расторжение?": true
            };

            const economicScore = data.economicScore;
            const legalScore = data.legalScore;

            // const economicFactors = data.economicFactors;
            // const legalFactors = data.legalFactors;

            // const economicScore =3;
            // const legalScore = 3;

            displayScore(economicScoreDiv, economicScore);
            displayScore(legalScoreDiv, legalScore);

            populateEconomicFactors(economicFactorsDiv, economicFactors);
            populateLegalFactors(legalFactorsDiv, legalFactors);

            analysisResultsDiv.style.display = 'block';
            
            resolve({
                success: true,
                message: 'Файл успешно проанализирован',
                economicScore: economicScore,
                legalScore: legalScore
            });
            
        })
        .catch(error => {
            // Отклоняем промис в случае ошибки
            reject('Ошибка при обработке файла: ' + error);
        });
    });
}

// Обработчики событий для кнопок скачивания
downloadReportBtn.addEventListener('click', () => {

    const reportContent = `
        Отчет по анализу файла
        ----------------------
        Имя файла: ${currentFileName}
        
        Юридические факторы:
        - Правообладатель не вправе расторгнуть договор без объяснения причин? : Да
        - Даются ли Пользователю права на товарный знак? : Да
        - Является ли Правообладатель юридическим лицом? : Да
        - Имееется ли государственная регистрация?: Да
        - Это лицензионное соглашение?: Да
        - Указан порядок подачи документов в Роспатент?: Да
        - Отсутствует ли запрет конкуренции?: Да
        - Отсутсвует ли автоматическое расторжение?: Да
        
        Экономичекие факторы:
        - Роялти: 5%
        - Паушальный взнос: 0 руб.
        - Штраф: 0 руб.
        
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Отчет_${currentFileName.replace(/\.[^/.]+$/, "")}.txt`; // Удаляем расширение и добавляем .txt
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
});

// Функция для обработки файла
function handleFile(file) {
    if (!file) return;

    analysisResultsDiv.style.display = 'none';
    analysisTitleDiv.style.display = 'none';

    if (!isValidFileType(file)) {
        resultDiv.innerHTML = 'Ошибка: Пожалуйста, загрузите только файлы PDF или DOCX.';
        return;
    }

    uploadArea.innerHTML = `<p>Файл: ${file.name}</p>`;

    currentFileName = file.name;

    checkFileValidity(file)
        .then(isValid => {
            if (isValid) {
                return analyzeFile(file);
            } else {
                throw new Error('Файл некорректен');
            }
        })
        .then(result => {
            resultDiv.innerHTML = '';

            // Меняем заголовки колонок - должны быть уже правильно установлены в HTML
            // Первая колонка (слева) будет юридической, вторая (справа) - экономической
            const analysisColumns = document.querySelectorAll('.analysis-column');
            if (analysisColumns.length === 2) {
                // Убедимся, что у нас корректные заголовки
                const firstHeader = analysisColumns[0].querySelector('h3');
                const secondHeader = analysisColumns[1].querySelector('h3');

                if (firstHeader && secondHeader) {
                    firstHeader.textContent = 'Юридическая экспертиза';
                    secondHeader.textContent = 'Экономическая экспертиза';
                }
            }

            analysisTitleDiv.textContent = `Анализ файла "${currentFileName}"`;
            analysisTitleDiv.style.display = 'block';
        })
        .catch(error => {
            console.error('Ошибка:', error);
            resultDiv.innerHTML = 'Произошла ошибка при обработке файла.';
        });

    // sendEvent('file_upload', {
    //     fileName: file.name,
    //     fileSize: file.size,
    //     fileType: file.type,
    // });
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

// Функции калькуляторов

// Функция для расчета Срока окупаемости
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

// Функция для расчета OCF (Денежный поток от операционной деятельности)
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    // Существующие инициализации...

    // Проверяем наличие элементов аккордеона
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    if (accordionHeaders.length > 0) {
        console.log('Аккордеон инициализирован, найдено заголовков:', accordionHeaders.length);
    }
});