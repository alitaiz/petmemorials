from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from src.models.memorial import db, MemorialPage, MediaFile, PremiumSubscription
from datetime import datetime
import os
import uuid
import mimetypes

memorial_bp = Blueprint('memorial', __name__)

# Cấu hình upload
UPLOAD_FOLDER = 'uploads'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv'}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_VIDEO_SIZE = 30 * 1024 * 1024  # 30MB

def allowed_file(filename, file_type):
    if '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    if file_type == 'image':
        return extension in ALLOWED_IMAGE_EXTENSIONS
    elif file_type == 'video':
        return extension in ALLOWED_VIDEO_EXTENSIONS
    return False

def get_client_ip():
    """Lấy IP của client"""
    if request.environ.get('HTTP_X_FORWARDED_FOR') is None:
        return request.environ['REMOTE_ADDR']
    else:
        return request.environ['HTTP_X_FORWARDED_FOR']

def resize_image(image_path, max_width=800):
    """Resize và nén ảnh - simplified version"""
    # Simplified version without PIL for deployment
    return True

@memorial_bp.route('/memorial-pages', methods=['POST'])
def create_memorial_page():
    """Tạo trang tưởng niệm mới"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'success': False, 'error': 'Name is required'}), 400
        
        # Tạo mã code nếu không có
        code = data.get('code')
        if not code:
            code = MemorialPage.generate_unique_code()
        else:
            # Kiểm tra code đã tồn tại chưa
            if MemorialPage.query.filter_by(code=code).first():
                return jsonify({'success': False, 'error': 'Code already exists'}), 400
        
        # Tạo memorial page mới
        memorial_page = MemorialPage(
            code=code,
            name=data.get('name'),
            content=data.get('content', ''),
            is_premium=data.get('is_premium', False),
            device_id=data.get('device_id'),
            user_agent=request.headers.get('User-Agent'),
            ip_address=get_client_ip()
        )
        
        db.session.add(memorial_page)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': memorial_page.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@memorial_bp.route('/memorial-pages/<code>', methods=['GET'])
def get_memorial_page(code):
    """Lấy thông tin trang tưởng niệm"""
    try:
        memorial_page = MemorialPage.query.filter_by(code=code).first()
        
        if not memorial_page:
            return jsonify({'success': False, 'error': 'Memorial page not found'}), 404
        
        # Cập nhật last_accessed
        memorial_page.last_accessed = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': memorial_page.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@memorial_bp.route('/memorial-pages/by-device/<device_id>', methods=['GET'])
def get_memorial_pages_by_device(device_id):
    """Lấy danh sách trang tưởng niệm của thiết bị"""
    try:
        memorial_pages = MemorialPage.query.filter_by(device_id=device_id).order_by(MemorialPage.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [
                {
                    'id': page.id,
                    'code': page.code,
                    'name': page.name,
                    'created_at': page.created_at.isoformat() if page.created_at else None
                }
                for page in memorial_pages
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@memorial_bp.route('/memorial-pages/<int:page_id>/media', methods=['POST'])
def upload_media(page_id):
    """Upload ảnh/video cho trang tưởng niệm"""
    try:
        # Kiểm tra memorial page tồn tại
        memorial_page = MemorialPage.query.get(page_id)
        if not memorial_page:
            return jsonify({'success': False, 'error': 'Memorial page not found'}), 404
        
        # Kiểm tra file upload
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        file_type = request.form.get('file_type')
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not file_type or file_type not in ['image', 'video']:
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        if not allowed_file(file.filename, file_type):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
        
        # Kiểm tra kích thước file
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_type == 'image' and file_size > MAX_IMAGE_SIZE:
            return jsonify({'success': False, 'error': 'Image file too large (max 5MB)'}), 413
        
        if file_type == 'video' and file_size > MAX_VIDEO_SIZE:
            return jsonify({'success': False, 'error': 'Video file too large (max 30MB)'}), 413
        
        # Kiểm tra giới hạn số lượng file
        current_images = MediaFile.query.filter_by(memorial_page_id=page_id, file_type='image').count()
        current_videos = MediaFile.query.filter_by(memorial_page_id=page_id, file_type='video').count()
        
        is_premium = PremiumSubscription.is_premium(memorial_page.device_id)
        
        if file_type == 'image':
            max_images = 10 if is_premium else 3
            if current_images >= max_images:
                return jsonify({'success': False, 'error': f'Maximum {max_images} images allowed'}), 400
        
        if file_type == 'video':
            max_videos = 3 if is_premium else 1
            if current_videos >= max_videos:
                return jsonify({'success': False, 'error': f'Maximum {max_videos} videos allowed'}), 400
        
        # Tạo thư mục upload nếu chưa có
        upload_dir = os.path.join(current_app.static_folder, UPLOAD_FOLDER, file_type + 's')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Tạo tên file unique
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Lưu file
        file.save(file_path)
        
        # Resize ảnh nếu cần
        if file_type == 'image':
            resize_image(file_path)
        
        # Lưu thông tin vào database
        media_file = MediaFile(
            memorial_page_id=page_id,
            file_type=file_type,
            file_name=filename,
            file_path=f"/static/{UPLOAD_FOLDER}/{file_type}s/{unique_filename}",
            file_size=os.path.getsize(file_path)
        )
        
        db.session.add(media_file)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': media_file.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@memorial_bp.route('/media/<int:media_id>', methods=['DELETE'])
def delete_media(media_id):
    """Xóa file media"""
    try:
        media_file = MediaFile.query.get(media_id)
        if not media_file:
            return jsonify({'success': False, 'error': 'Media file not found'}), 404
        
        # Xóa file vật lý
        file_path = os.path.join(current_app.static_folder, media_file.file_path.lstrip('/'))
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Xóa record trong database
        db.session.delete(media_file)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'File deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@memorial_bp.route('/premium/status/<device_id>', methods=['GET'])
def get_premium_status(device_id):
    """Kiểm tra trạng thái premium"""
    try:
        is_premium = PremiumSubscription.is_premium(device_id)
        subscription = PremiumSubscription.query.filter_by(device_id=device_id, status='active').first()
        
        return jsonify({
            'success': True,
            'data': {
                'is_premium': is_premium,
                'expires_at': subscription.expires_at.isoformat() if subscription and subscription.expires_at else None
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@memorial_bp.route('/premium/subscribe', methods=['POST'])
def create_premium_subscription():
    """Tạo subscription premium (mock - không tích hợp Stripe thật)"""
    try:
        data = request.get_json()
        device_id = data.get('device_id')
        
        if not device_id:
            return jsonify({'success': False, 'error': 'Device ID is required'}), 400
        
        # Mock subscription (trong thực tế sẽ tích hợp với Stripe)
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(days=30)  # 1 tháng
        
        subscription = PremiumSubscription(
            device_id=device_id,
            stripe_subscription_id=f"sub_mock_{uuid.uuid4().hex[:8]}",
            status='active',
            expires_at=expires_at
        )
        
        db.session.add(subscription)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': subscription.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

