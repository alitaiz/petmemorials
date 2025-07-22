from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import random
import string

# SQLAlchemy instance
# This will be initialised in main.py


db = SQLAlchemy()

class MemorialPage(db.Model):
    __tablename__ = 'memorial_pages'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, default='')
    is_premium = db.Column(db.Boolean, default=False)
    device_id = db.Column(db.String(64))
    user_agent = db.Column(db.String(256))
    ip_address = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_accessed = db.Column(db.DateTime)

    media_files = db.relationship('MediaFile', backref='memorial_page', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'content': self.content,
            'is_premium': self.is_premium,
            'device_id': self.device_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'media_files': [m.to_dict() for m in self.media_files]
        }

    @staticmethod
    def generate_unique_code(length: int = 6):
        chars = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(random.choices(chars, k=length))
            if not MemorialPage.query.filter_by(code=code).first():
                return code


class MediaFile(db.Model):
    __tablename__ = 'media_files'

    id = db.Column(db.Integer, primary_key=True)
    memorial_page_id = db.Column(db.Integer, db.ForeignKey('memorial_pages.id'), nullable=False)
    file_type = db.Column(db.String(10))
    file_name = db.Column(db.String(255))
    file_path = db.Column(db.String(255))
    file_size = db.Column(db.Integer)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'memorial_page_id': self.memorial_page_id,
            'file_type': self.file_type,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class PremiumSubscription(db.Model):
    __tablename__ = 'premium_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(64), nullable=False)
    stripe_subscription_id = db.Column(db.String(80))
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)

    @staticmethod
    def is_premium(device_id: str) -> bool:
        sub = PremiumSubscription.query.filter_by(device_id=device_id, status='active').first()
        if not sub:
            return False
        if sub.expires_at and sub.expires_at < datetime.utcnow():
            sub.status = 'expired'
            db.session.commit()
            return False
        return True

    def to_dict(self):
        return {
            'id': self.id,
            'device_id': self.device_id,
            'stripe_subscription_id': self.stripe_subscription_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
