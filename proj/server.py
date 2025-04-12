from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from model_funcs import check_contract

# Импортируем вашу функцию анализа (замените на реальный импорт)
# from your_analysis_module import analyze_file  # Предполагается, что функция уже есть

app = Flask(__name__, static_folder='static')
CORS(app)

# Конфигурация для загрузки файлов
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}  # Разрешенные форматы
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Создаем папку для загрузок, если её нет
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Проверяем, что у файла допустимое расширение."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({"error": "Файл не найден в запросе"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Не выбран файл"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Анализируем файл (ваша функция)
        try:
            print(filename)
            # legal_score, economic_score = 3, 3
            legal_score, economic_score, legalFactors, economicFactors = check_contract(filename)
            print(legal_score, economic_score)
        except Exception as e:
            return jsonify({"error": f"Ошибка анализа: {str(e)}"}), 500

        # Удаляем файл после анализа (опционально)
        os.remove(filepath)

        return jsonify({
            "legalScore": legal_score,
            "economicScore": economic_score,
            # "legalFactors": legalFactors,
            # "economicFactors": economicFactors
        })
    else:
        return jsonify({"error": "Недопустимый формат файла"}), 400

if __name__ == '__main__':
    print("start")
    app.run(port=5000, debug=True)