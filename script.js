const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const resultDiv = document.getElementById('result');

// Обработка перетаскивания файла
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.backgroundColor = '#e0f7fa';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.backgroundColor = '#f0f8ff';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.backgroundColor = '#f0f8ff';
  const file = e.dataTransfer.files[0]; // Получение файла
  handleFile(file); // Обработка файла
});

// Обработка выбора файла через диалоговое окно
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]; // Получение файла
  handleFile(file); // Обработка файла
});

// Функция для обработки файла
function handleFile(file) {
  if (!file) return; // Если файл не выбран, выходим

  // Показываем сообщение о загрузке
  resultDiv.innerHTML = 'Файл загружается...';

  // Создаем FormData для отправки файла на сервер
  const formData = new FormData();
  formData.append('file', file);

  // Отправляем файл на сервер
  fetch('/upload', {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json()) // Получаем ответ от сервера
    .then((data) => {
      // Отображаем результат
      resultDiv.innerHTML = `Результат: ${data.message}`;

      // Если сервер вернул ссылку для скачивания, создаем кнопку
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = 'processed_file'; // Имя файла для скачивания
        link.textContent = 'Скачать измененный файл';
        resultDiv.appendChild(link);
      }
    })
    .catch((error) => {
      // Обработка ошибок
      console.error('Ошибка:', error);
      resultDiv.innerHTML = 'Произошла ошибка при обработке файла.';
    });
}