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
const downloadContractBtn = document.getElementById('downloadContract');

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

// Функция-заглушка для проверки файла на корректность
function checkFileValidity(file) {
    return new Promise((resolve) => {
        resultDiv.innerHTML = 'Проверка файла на корректность...';
        // Имитация длительной проверки
        setTimeout(() => {
            uploadArea.style.backgroundColor = '#CCFFCC';
            resolve(true); // Всегда возвращаем успешный результат
        }, 2000);
    });
}

// Функция для отображения случайной оценки и применения соответствующего цвета
function displayScore(element, score) {
    element.textContent = score;
    element.className = 'score score-' + score + ' score-info';
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

    // Формируем утверждение на основе вопроса и значения
    let statement = '';
    if (question === 'Правообладатель вправе расторгнуть договор без объяснения причин?') {
        statement = value === 1
            ? 'Правообладатель вправе расторгнуть договор без объяснения причин'
            : 'Правообладатель не вправе расторгнуть договор без объяснения причин';
    } else if (question === 'Даются ли Пользователю права на товарный знак?') {
        statement = value === 1
            ? 'Пользователю даются права на товарный знак'
            : 'Пользователю не даются права на товарный знак';
    } else if (question === 'Является ли Правообладатель юридическим лицом?') {
        statement = value === 1
            ? 'Правообладатель является юридическим лицом'
            : 'Правообладатель не является юридическим лицом';
    }

    // Добавляем объединенное утверждение в первую колонку
    const factorStatement = document.createElement('span');
    factorStatement.textContent = statement;
    factorStatement.style.gridColumn = '1 / 3'; // Растягиваем на две колонки
    factorElement.appendChild(factorStatement);

    // Добавляем пустой элемент для сохранения структуры грида
    const emptyElement = document.createElement('span');
    factorElement.appendChild(emptyElement);

    // Добавляем ссылку
    const factorLink = document.createElement('a');
    factorLink.href = "#";
    factorLink.textContent = 'Ссылка';
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

    for (const [question, value] of Object.entries(factors)) {
        container.appendChild(createLegalFactorElement(question, value));
    }
}

// Функция-заглушка для анализа файла
function analyzeFile(file) {
    return new Promise((resolve) => {
        resultDiv.innerHTML = 'Анализ файла...';

        // Здесь должна быть заглушка словаря с данными анализа
        const analysisData = {
            'Роялти': 35,
            'Паушальный взнос': 1000000,
            'Штраф': 1000000,
            'Правообладатель вправе расторгнуть договор без объяснения причин?': 1,
            'Даются ли Пользователю права на товарный знак?': 1,
            'Является ли Правообладатель юридическим лицом?': 1
        };

        // Разделение словаря на экономические и юридические факторы
        const economicFactors = {
            'Роялти': analysisData['Роялти'],
            'Паушальный взнос': analysisData['Паушальный взнос'],
            'Штраф': analysisData['Штраф']
        };

        const legalFactors = {
            'Правообладатель вправе расторгнуть договор без объяснения причин?': analysisData['Правообладатель вправе расторгнуть договор без объяснения причин?'],
            'Даются ли Пользователю права на товарный знак?': analysisData['Даются ли Пользователю права на товарный знак?'],
            'Является ли Правообладатель юридическим лицом?': analysisData['Является ли Правообладатель юридическим лицом?']
        };

        // Генерация случайных оценок
        const economicScore = /*Math.floor(Math.random() * 3) + */1;
        const legalScore = /*Math.floor(Math.random() * 3) + */1;

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
    });
}

// Обработчики событий для кнопок скачивания
downloadReportBtn.addEventListener('click', () => {
    alert('Загрузка отчета для файла: ' + currentFileName);
    // Здесь будет реальная функция скачивания
});

downloadContractBtn.addEventListener('click', () => {
    alert('Загрузка проанализированного договора: ' + currentFileName);
    // Здесь будет реальная функция скачивания
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

            analysisTitleDiv.textContent = `Анализ файла "${currentFileName}"`;
            analysisTitleDiv.style.display = 'block';
        })
        .catch(error => {
            console.error('Ошибка:', error);
            resultDiv.innerHTML = 'Произошла ошибка при обработке файла.';
        });

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