from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from werkzeug.utils import secure_filename
import time

from model_funcs import check_contract

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Полное разрешение CORS

# Используем временную папку системы
UPLOAD_FOLDER = tempfile.gettempdir() + '/contract_uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/analyze', methods=['POST'])
def analyze():
    # Проверяем наличие файла в памяти
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "Invalid file type"}), 400

    try:
        # Создаем временный файл
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # Сохраняем и сразу закрываем файл
        with open(temp_path, 'wb') as f:
            file.save(f)

        result = check_contract(temp_path)
        print(result)
        legal_score, economic_score, legalFactors, economicFactors = result
        
        
        # Удаляем временный файл
        try:
            os.unlink(temp_path)
        except:
            pass
            
        return jsonify({
            "legalScore": legal_score,
            "economicScore": economic_score,
            "legalFactors": legalFactors,
            "economicFactors": economicFactors
        })

    except Exception as e:
        # Гарантированное удаление файла при ошибке
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)

