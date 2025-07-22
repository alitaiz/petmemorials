from flask import Blueprint, jsonify
from src.models.memorial import db, MemorialPage, MediaFile, PremiumSubscription
from sqlalchemy import func
import os

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/stats', methods=['GET'])
def get_stats():
    """Thống kê hệ thống"""
    try:
        # Đếm số lượng
        total_pages = MemorialPage.query.count()
        total_premium = PremiumSubscription.query.filter_by(status='active').count()
        total_media_files = MediaFile.query.count()
        
        # Tính tổng dung lượng storage
        total_size = db.session.query(func.sum(MediaFile.file_size)).scalar() or 0
        storage_used = f"{total_size / (1024*1024):.2f}MB"
        
        return jsonify({
            'success': True,
            'data': {
                'total_pages': total_pages,
                'total_premium': total_premium,
                'total_media_files': total_media_files,
                'storage_used': storage_used
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/admin/pages', methods=['GET'])
def get_all_pages():
    """Danh sách tất cả trang tưởng niệm"""
    try:
        pages = MemorialPage.query.order_by(MemorialPage.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [
                {
                    'id': page.id,
                    'code': page.code,
                    'name': page.name,
                    'is_premium': page.is_premium,
                    'created_at': page.created_at.isoformat() if page.created_at else None,
                    'last_accessed': page.last_accessed.isoformat() if page.last_accessed else None,
                    'media_count': len(page.media_files)
                }
                for page in pages
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/admin/cleanup', methods=['POST'])
def cleanup_old_data():
    """Dọn dẹp dữ liệu cũ (không truy cập trong 1 năm)"""
    try:
        from datetime import datetime, timedelta
        
        # Tìm các trang không truy cập trong 1 năm
        one_year_ago = datetime.utcnow() - timedelta(days=365)
        old_pages = MemorialPage.query.filter(MemorialPage.last_accessed < one_year_ago).all()
        
        deleted_count = 0
        for page in old_pages:
            # Xóa các file media vật lý
            for media in page.media_files:
                file_path = os.path.join('src/static', media.file_path.lstrip('/'))
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # Xóa page (cascade sẽ xóa media records)
            db.session.delete(page)
            deleted_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Deleted {deleted_count} old memorial pages'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

