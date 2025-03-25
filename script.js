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

// Сохраняем изначальное содержимое области загрузки
const originalUploadAreaContent = uploadArea.innerHTML;
const originalBackgroundColor = '#f0f8ff'; 

let currentFileName = '';

// Допустимые типы файлов
const allowedFileTypes = [
    'application/pdf', // PDF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
];

const economicFactorsExamples = [
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" }
];

const legalFactorsExamples = [
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" },
    { factor: "Фактор", result: "Результат", link: "#" }
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
    element.className = 'score score-' + score;
}

// Функция для создания строки с фактором
function createFactorElement(factor) {
    const factorElement = document.createElement('div');
    factorElement.className = 'factor-item';

    // Добавляем название фактора
    const factorName = document.createElement('span');
    factorName.textContent = factor.factor;
    factorElement.appendChild(factorName);

    // Добавляем результат
    const factorResult = document.createElement('span');
    factorResult.textContent = factor.result;
    factorElement.appendChild(factorResult);

    // Добавляем ссылку
    const factorLink = document.createElement('a');
    factorLink.href = factor.link;
    factorLink.textContent = 'Ссылка';
    factorElement.appendChild(factorLink);

    return factorElement;
}

// Функция для заполнения списка факторов
function populateFactors(container, factors) {
    container.innerHTML = '';

    factors.forEach(factor => {
        container.appendChild(createFactorElement(factor));
    });
}

// Функция-заглушка для анализа файла
function analyzeFile(file) {
    return new Promise((resolve) => {
        resultDiv.innerHTML = 'Анализ файла...';

        // Имитация длительного анализа
        setTimeout(() => {
            const economicScore = Math.floor(Math.random() * 3) + 1;
            const legalScore = Math.floor(Math.random() * 3) + 1;

            displayScore(economicScoreDiv, economicScore);
            displayScore(legalScoreDiv, legalScore);

            populateFactors(economicFactorsDiv, economicFactorsExamples);
            populateFactors(legalFactorsDiv, legalFactorsExamples);

            analysisResultsDiv.style.display = 'block';

            resolve({
                success: true,
                message: 'Файл успешно проанализирован',
                economicScore: economicScore,
                legalScore: legalScore
            });
        }, 3000); 
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
}