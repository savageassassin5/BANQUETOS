from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
from io import BytesIO
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'mayur-simran-banquet-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Mayur Simran Banquet API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"  # Platform super admin
    TENANT_ADMIN = "tenant_admin"  # Tenant owner/admin
    ADMIN = "admin"  # Legacy admin (maps to tenant_admin)
    RECEPTION = "reception"
    STAFF = "staff"
    CUSTOMER = "customer"

class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TRIAL = "trial"

class SlotType(str, Enum):
    DAY = "day"      # 10:00 AM - 05:00 PM
    NIGHT = "night"  # 08:00 PM - 01:00 AM

class PaymentMode(str, Enum):
    CASH = "cash"
    CREDIT = "credit"
    UPI = "upi"

class BookingStatus(str, Enum):
    ENQUIRY = "enquiry"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"

class EventType(str, Enum):
    WEDDING = "wedding"
    RECEPTION = "reception"
    ENGAGEMENT = "engagement"
    BIRTHDAY = "birthday"
    CORPORATE = "corporate"
    CUSTOM = "custom"

class MenuType(str, Enum):
    VEG = "veg"
    NON_VEG = "non_veg"
    MIXED = "mixed"

# ==================== MULTI-TENANT MODELS ====================
class PlanCreate(BaseModel):
    name: str
    description: str = ""
    features: dict = {}

class Plan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    features: dict = {}  # {bookings: true, calendar: true, ...}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TenantCreate(BaseModel):
    business_name: str
    country: str = "India"
    timezone: str = "Asia/Kolkata"
    currency: str = "INR"
    status: TenantStatus = TenantStatus.ACTIVE
    plan_id: Optional[str] = None
    features_override: dict = {}

class TenantUpdate(BaseModel):
    business_name: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    status: Optional[TenantStatus] = None
    plan_id: Optional[str] = None
    features_override: Optional[dict] = None

class Tenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_name: str
    country: str = "India"
    timezone: str = "Asia/Kolkata"
    currency: str = "INR"
    status: TenantStatus = TenantStatus.ACTIVE
    plan_id: Optional[str] = None
    features_override: dict = {}  # Per-tenant feature overrides
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== MODELS ====================
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: UserRole = UserRole.CUSTOMER
    tenant_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    role: UserRole
    tenant_id: Optional[str] = None  # Null for super_admin
    status: str = "active"  # active, disabled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    """User response with tenant info and effective features"""
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: EmailStr
    phone: str
    role: str
    tenant_id: Optional[str] = None
    tenant_status: Optional[str] = None
    effective_features: dict = {}

class TokenResponse(BaseModel):
    token: str
    user: UserResponse


class HallCreate(BaseModel):
    name: str
    capacity: int
    price_per_day: float = 0
    price_per_event: float = 0
    price_per_plate: float = 0
    description: str = ""
    amenities: List[str] = []
    images: List[str] = []
    color: str = "#6366f1"  # Default violet color

class Hall(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    capacity: int
    price_per_day: float = 0
    price_per_event: float = 0
    price_per_plate: float = 0
    description: str = ""
    amenities: List[str] = []
    images: List[str] = []
    color: str = "#6366f1"
    is_active: bool = True
    tenant_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PricingType(str, Enum):
    PER_PLATE = "per_plate"
    FIXED = "fixed"
    CUSTOM = "custom"

class MenuItemCreate(BaseModel):
    name: str
    category: str
    menu_type: MenuType
    price_per_plate: float
    pricing_type: PricingType = PricingType.PER_PLATE
    description: str = ""
    is_addon: bool = False

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    menu_type: MenuType
    price_per_plate: float
    pricing_type: PricingType = PricingType.PER_PLATE
    description: str = ""
    is_addon: bool = False
    is_active: bool = True
    tenant_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: str = ""

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    address: str = ""
    tenant_id: Optional[str] = None
    is_deleted: bool = False  # Soft delete
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUDIT LOG MODEL ====================
class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    user_id: str
    user_email: str
    action: str  # create, update, delete, restore
    entity_type: str  # booking, hall, customer, etc.
    entity_id: str
    changes: dict = {}  # {field: {old: value, new: value}}
    metadata: dict = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    customer_id: str
    hall_id: str
    event_type: EventType
    event_date: str  # YYYY-MM-DD
    slot: SlotType = SlotType.DAY  # Day or Night slot
    guest_count: int
    menu_items: List[str] = []
    addons: List[str] = []
    special_requests: str = ""
    # Custom menu pricing overrides: {menu_item_id: custom_price}
    custom_menu_prices: dict = {}
    # GST options
    gst_option: str = "on"  # 'on', 'off', 'custom'
    custom_gst_percent: float = 5.0
    # Discount options
    discount_type: str = "percent"  # 'percent' or 'fixed'
    discount_value: float = 0
    # Payment splits: [{"method": "cash", "amount": 1000}, {"method": "upi", "amount": 2000}]
    payment_splits: List[dict] = []
    # Advance payment (legacy support)
    payment_received: bool = False
    advance_amount: float = 0
    payment_method: str = "cash"  # 'cash', 'upi', 'credit'
    # Linked vendors
    linked_vendors: List[str] = []

class BookingUpdate(BaseModel):
    hall_id: Optional[str] = None
    event_type: Optional[EventType] = None
    event_date: Optional[str] = None
    slot: Optional[SlotType] = None
    guest_count: Optional[int] = None
    menu_items: Optional[List[str]] = None
    addons: Optional[List[str]] = None
    special_requests: Optional[str] = None
    custom_menu_prices: Optional[dict] = None
    gst_option: Optional[str] = None
    custom_gst_percent: Optional[float] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    payment_splits: Optional[List[dict]] = None
    payment_received: Optional[bool] = None
    advance_amount: Optional[float] = None
    payment_method: Optional[str] = None
    linked_vendors: Optional[List[str]] = None
    status: Optional[BookingStatus] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_number: str = Field(default_factory=lambda: f"MSB-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    customer_id: str
    hall_id: str
    event_type: EventType
    event_date: str
    slot: SlotType = SlotType.DAY
    start_time: str = ""  # Auto-set based on slot
    end_time: str = ""    # Auto-set based on slot
    guest_count: int
    menu_items: List[str] = []
    addons: List[str] = []
    special_requests: str = ""
    custom_menu_prices: dict = {}
    # Charges (NO hall_charge - removed)
    food_charge: float = 0
    addon_charge: float = 0
    subtotal: float = 0
    # Discount
    discount_type: str = "percent"
    discount_value: float = 0
    discount_amount: float = 0
    # GST
    gst_option: str = "on"  # 'on', 'off', 'custom'
    gst_percent: float = 5.0
    gst_amount: float = 0
    total_amount: float = 0
    # Payment splits
    payment_splits: List[dict] = []
    # Payment tracking
    payment_received: bool = False
    advance_paid: float = 0
    payment_method: str = "cash"
    balance_due: float = 0
    status: BookingStatus = BookingStatus.ENQUIRY
    payment_status: PaymentStatus = PaymentStatus.PENDING
    # Linked vendors
    linked_vendors: List[str] = []
    # Party costing (expenses for this booking - admin only)
    total_expenses: float = 0
    net_profit: float = 0
    tenant_id: Optional[str] = None
    is_deleted: bool = False  # Soft delete
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    booking_id: str
    amount: float
    payment_mode: PaymentMode = PaymentMode.CASH
    notes: str = ""
    recorded_by: str = ""
    payment_date: str = ""  # YYYY-MM-DD, defaults to today

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    amount: float
    payment_mode: PaymentMode = PaymentMode.CASH
    notes: str = ""
    recorded_by: str = ""
    payment_date: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== PARTY EXPENSE MODELS (Admin Only) ====================
class PartyExpenseCreate(BaseModel):
    booking_id: str
    expense_name: str
    amount: float
    notes: str = ""
    vendor_id: Optional[str] = None  # Link expense to vendor

class PartyExpense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    expense_name: str
    amount: float
    notes: str = ""
    vendor_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== PARTY PLANNING MODELS ====================
class StaffAssignment(BaseModel):
    name: str
    role: str  # 'waiter', 'chef', 'helper', 'custom'
    charge: float = 0

class PartyPlanCreate(BaseModel):
    booking_id: str
    dj_vendor_id: Optional[str] = None
    decor_vendor_id: Optional[str] = None
    catering_vendor_id: Optional[str] = None
    custom_vendors: List[str] = []  # List of vendor IDs
    staff_assignments: List[dict] = []  # [{name, role, charge}]
    notes: str = ""

class PartyPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    dj_vendor_id: Optional[str] = None
    decor_vendor_id: Optional[str] = None
    catering_vendor_id: Optional[str] = None
    custom_vendors: List[str] = []
    staff_assignments: List[dict] = []
    total_staff_charges: float = 0
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== VENDOR PAYMENT MODELS ====================
class VendorPaymentCreate(BaseModel):
    vendor_id: str
    booking_id: Optional[str] = None
    amount: float
    payment_mode: PaymentMode = PaymentMode.CASH
    description: str = ""

class VendorPayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    booking_id: Optional[str] = None
    amount: float
    payment_mode: PaymentMode = PaymentMode.CASH
    description: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== VENDOR MODELS ====================
class VendorType(str, Enum):
    DECOR = "decor"
    DJ_SOUND = "dj_sound"
    FLOWER = "flower"
    LIGHTING = "lighting"
    CATERING = "catering"
    PHOTOGRAPHY = "photography"
    OTHER = "other"

class VendorPaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"

class VendorCreate(BaseModel):
    name: str
    vendor_type: VendorType
    phone: str
    email: str = ""
    address: str = ""
    services: List[str] = []
    base_rate: float = 0

class Vendor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    vendor_type: VendorType
    phone: str
    email: str = ""
    address: str = ""
    services: List[str] = []
    base_rate: float = 0
    total_events: int = 0
    # Balance sheet fields
    total_payable: float = 0
    total_paid: float = 0
    outstanding_balance: float = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VendorAssignmentCreate(BaseModel):
    booking_id: str
    vendor_id: str
    service_description: str = ""
    agreed_amount: float
    advance_paid: float = 0

class VendorAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    vendor_id: str
    service_description: str = ""
    agreed_amount: float
    advance_paid: float = 0
    balance_due: float = 0
    payment_status: VendorPaymentStatus = VendorPaymentStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== EXPENSE MODELS ====================
class ExpenseCategory(str, Enum):
    DECOR = "decor"
    VENDOR = "vendor"
    STAFF = "staff"
    LOGISTICS = "logistics"
    FOOD = "food"
    UTILITIES = "utilities"
    OTHER = "other"

class ExpenseCreate(BaseModel):
    booking_id: Optional[str] = None
    category: ExpenseCategory
    description: str
    amount: float
    vendor_id: Optional[str] = None
    date: str

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: Optional[str] = None
    category: ExpenseCategory
    description: str
    amount: float
    vendor_id: Optional[str] = None
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== ALERT MODELS ====================
class AlertPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class AlertType(str, Enum):
    DOUBLE_BOOKING = "double_booking"
    PAYMENT_OVERDUE = "payment_overdue"
    NO_MENU_ASSIGNED = "no_menu_assigned"
    LOW_ADVANCE = "low_advance"
    EVENT_TOMORROW = "event_tomorrow"

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_type: AlertType
    priority: AlertPriority
    title: str
    message: str
    booking_id: Optional[str] = None
    is_resolved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== NOTIFICATION MODELS ====================
class NotificationType(str, Enum):
    BOOKING_CONFIRMATION = "booking_confirmation"
    PAYMENT_REMINDER = "payment_reminder"
    EVENT_REMINDER = "event_reminder"

class NotificationLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    notification_type: NotificationType
    channel: str  # whatsapp, sms
    recipient: str
    message: str
    status: str = "sent"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    notification_type: NotificationType
    channel: str
    template: str
    is_active: bool = True
    payment_method: str
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnquiryCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    event_type: EventType
    event_date: str
    guest_count: int
    message: str = ""

class Enquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    event_type: EventType
    event_date: str
    guest_count: int
    message: str = ""
    is_contacted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HELPER FUNCTIONS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str, tenant_id: Optional[str] = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "tenant_id": tenant_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_super_admin(current_user: dict):
    """Check if user is super admin"""
    if current_user.get('role') != 'super_admin':
        raise HTTPException(status_code=403, detail="Super admin access required")
    return True

def require_admin(current_user: dict):
    """Check if user is admin or tenant_admin"""
    if current_user.get('role') not in ['admin', 'tenant_admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    return True

async def get_effective_features(tenant_id: Optional[str]) -> dict:
    """Get effective features for a tenant (plan features + overrides)"""
    if not tenant_id:
        # Super admin has all features
        return {
            "bookings": True, "calendar": True, "halls": True, "menu": True,
            "customers": True, "payments": True, "enquiries": True, "reports": True,
            "vendors": True, "analytics": True, "notifications": True, "expenses": True,
            "party_planning": True
        }
    
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        return {}
    
    # Start with default features
    features = {
        "bookings": True, "calendar": True, "halls": True, "menu": True,
        "customers": True, "payments": True, "enquiries": True, "reports": False,
        "vendors": False, "analytics": False, "notifications": False, "expenses": False,
        "party_planning": False
    }
    
    # Apply plan features if plan exists
    if tenant.get('plan_id'):
        plan = await db.plans.find_one({"id": tenant['plan_id']}, {"_id": 0})
        if plan and plan.get('features'):
            features.update(plan['features'])
    
    # Apply tenant-specific overrides
    if tenant.get('features_override'):
        features.update(tenant['features_override'])
    
    return features

async def check_feature_access(current_user: dict, feature: str):
    """Check if user has access to a feature"""
    if current_user.get('role') == 'super_admin':
        return True
    
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=403, detail="No tenant associated")
    
    features = await get_effective_features(tenant_id)
    if not features.get(feature, False):
        raise HTTPException(status_code=403, detail=f"Feature '{feature}' not enabled for your plan")
    
    return True

async def get_tenant_filter(current_user: dict) -> dict:
    """Get MongoDB filter for tenant isolation"""
    if current_user.get('role') == 'super_admin':
        return {}  # Super admin can see all
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=403, detail="No tenant associated")
    return {"tenant_id": tenant_id}

# ==================== AUDIT LOG HELPER ====================
async def create_audit_log(
    tenant_id: Optional[str],
    user_id: str,
    user_email: str,
    action: str,
    entity_type: str,
    entity_id: str,
    changes: dict = None,
    metadata: dict = None
):
    """Create an audit log entry"""
    log = AuditLog(
        tenant_id=tenant_id,
        user_id=user_id,
        user_email=user_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes or {},
        metadata=metadata or {}
    )
    log_doc = log.model_dump()
    log_doc['timestamp'] = log_doc['timestamp'].isoformat()
    await db.audit_logs.insert_one(log_doc)
    return log.id

# ==================== PERMISSION MATRIX ====================
PERMISSION_MATRIX = {
    "super_admin": ["*"],  # All permissions
    "tenant_admin": [
        "bookings:*", "halls:*", "menu:*", "customers:*", "payments:*",
        "enquiries:*", "reports:read", "vendors:*", "analytics:read",
        "expenses:*", "party_planning:*", "users:read", "users:write",
        "audit:read"
    ],
    "admin": [
        "bookings:*", "halls:*", "menu:*", "customers:*", "payments:*",
        "enquiries:*", "reports:read", "vendors:*", "analytics:read",
        "expenses:*", "party_planning:*", "audit:read"
    ],
    "reception": [
        "bookings:create", "bookings:read", "bookings:update",
        "halls:read", "menu:read", "customers:*", "payments:create", "payments:read",
        "enquiries:*"
    ],
    "staff": [
        "bookings:read", "halls:read", "menu:read", "customers:read"
    ]
}

def has_permission(role: str, permission: str) -> bool:
    """Check if a role has a specific permission"""
    if role == "super_admin":
        return True
    
    permissions = PERMISSION_MATRIX.get(role, [])
    if "*" in permissions:
        return True
    
    # Check exact match or wildcard
    entity, action = permission.split(":") if ":" in permission else (permission, "*")
    
    for perm in permissions:
        perm_entity, perm_action = perm.split(":") if ":" in perm else (perm, "*")
        if perm_entity == entity and (perm_action == "*" or perm_action == action):
            return True
    
    return False

def require_permission(current_user: dict, permission: str):
    """Require a specific permission"""
    if not has_permission(current_user.get('role', ''), permission):
        raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")
    return True

# ==================== BOOKING CONFLICT PREVENTION ====================
async def check_booking_conflict(hall_id: str, event_date: str, slot: str, exclude_booking_id: str = None, tenant_id: str = None):
    """Check if there's a booking conflict"""
    query = {
        "hall_id": hall_id,
        "event_date": event_date,
        "slot": slot,
        "status": {"$ne": "cancelled"},
        "is_deleted": {"$ne": True}
    }
    
    if exclude_booking_id:
        query["id"] = {"$ne": exclude_booking_id}
    
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    existing = await db.bookings.find_one(query, {"_id": 0})
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Booking conflict: Hall is already booked for {event_date} ({slot} slot)"
        )

def get_slot_times(slot: SlotType) -> tuple:
    """Get start and end times for a slot"""
    if slot == SlotType.DAY:
        return ("10:00", "17:00")  # 10 AM - 5 PM
    else:
        return ("20:00", "01:00")  # 8 PM - 1 AM

def calculate_booking_charges(menu_items_list: list, addons_list: list, guest_count: int, discount_type: str, discount_value: float, gst_option: str = "on", custom_gst_percent: float = 5.0, custom_menu_prices: dict = None) -> dict:
    """Calculate booking charges with configurable GST"""
    if custom_menu_prices is None:
        custom_menu_prices = {}
    
    # Food charge - check for custom prices per item
    food_charge = 0
    for item in menu_items_list:
        item_id = item.get('id', '')
        pricing_type = item.get('pricing_type', 'per_plate')
        
        # Check if there's a custom price override
        if item_id in custom_menu_prices:
            food_charge += custom_menu_prices[item_id]
        elif pricing_type == 'fixed':
            food_charge += item.get('price_per_plate', 0)
        else:  # per_plate
            food_charge += item.get('price_per_plate', 0) * guest_count
    
    # Add-on charge (fixed amounts)
    addon_charge = 0
    for addon in addons_list:
        addon_id = addon.get('id', '')
        if addon_id in custom_menu_prices:
            addon_charge += custom_menu_prices[addon_id]
        else:
            addon_charge += addon.get('price_per_plate', 0)
    
    # Subtotal (NO hall charge)
    subtotal = food_charge + addon_charge
    
    # Apply discount (percent or fixed)
    if discount_type == 'percent':
        discount_amount = subtotal * (discount_value / 100)
    else:
        discount_amount = discount_value
    
    after_discount = max(0, subtotal - discount_amount)
    
    # GST based on option
    if gst_option == 'off':
        gst_percent = 0
        gst_amount = 0
    elif gst_option == 'custom':
        gst_percent = custom_gst_percent
        gst_amount = after_discount * (gst_percent / 100)
    else:  # 'on' - default 5%
        gst_percent = 5.0
        gst_amount = after_discount * (gst_percent / 100)
    
    # Total
    total_amount = after_discount + gst_amount
    
    return {
        'food_charge': food_charge,
        'addon_charge': addon_charge,
        'subtotal': subtotal,
        'discount_amount': discount_amount,
        'gst_percent': gst_percent,
        'gst_amount': gst_amount,
        'total_amount': total_amount
    }

def serialize_doc(doc: dict) -> dict:
    """Remove MongoDB _id and convert datetime to ISO string"""
    if doc is None:
        return None
    doc.pop('_id', None)
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        tenant_id=user_data.tenant_id
    )
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Get effective features
    effective_features = await get_effective_features(user.tenant_id)
    
    # Get tenant status
    tenant_status = None
    if user.tenant_id:
        tenant = await db.tenants.find_one({"id": user.tenant_id}, {"_id": 0})
        tenant_status = tenant.get('status') if tenant else None
    
    token = create_token(user.id, user.email, user.role.value, user.tenant_id)
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role.value,
        tenant_id=user.tenant_id,
        tenant_status=tenant_status,
        effective_features=effective_features
    )
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is disabled
    if user_doc.get('status') == 'disabled':
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Get effective features
    tenant_id = user_doc.get('tenant_id')
    effective_features = await get_effective_features(tenant_id)
    
    # Get tenant status
    tenant_status = None
    if tenant_id:
        tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
        if tenant:
            tenant_status = tenant.get('status')
            # Check if tenant is suspended
            if tenant_status == 'suspended' and user_doc.get('role') != 'super_admin':
                raise HTTPException(status_code=403, detail="Your organization's account has been suspended")
    
    token = create_token(user_doc['id'], user_doc['email'], user_doc['role'], tenant_id)
    user_response = UserResponse(
        id=user_doc['id'],
        name=user_doc['name'],
        email=user_doc['email'],
        phone=user_doc['phone'],
        role=user_doc['role'],
        tenant_id=tenant_id,
        tenant_status=tenant_status,
        effective_features=effective_features
    )
    return TokenResponse(token=token, user=user_response)

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get effective features
    tenant_id = user_doc.get('tenant_id')
    effective_features = await get_effective_features(tenant_id)
    
    # Get tenant status
    tenant_status = None
    if tenant_id:
        tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
        tenant_status = tenant.get('status') if tenant else None
    
    return {
        "id": user_doc['id'],
        "name": user_doc['name'],
        "email": user_doc['email'],
        "phone": user_doc['phone'],
        "role": user_doc['role'],
        "tenant_id": tenant_id,
        "tenant_status": tenant_status,
        "effective_features": effective_features
    }

# ==================== HALL ROUTES ====================
@api_router.get("/halls", response_model=List[Hall])
async def get_halls():
    halls = await db.halls.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [Hall(**h) for h in halls]

@api_router.get("/public/venues", response_model=List[Hall])
async def get_public_venues():
    """Public endpoint for landing page to fetch venue data"""
    halls = await db.halls.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [Hall(**h) for h in halls]

@api_router.get("/halls/{hall_id}", response_model=Hall)
async def get_hall(hall_id: str):
    hall = await db.halls.find_one({"id": hall_id}, {"_id": 0})
    if not hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    return Hall(**hall)

@api_router.post("/halls", response_model=Hall)
async def create_hall(hall_data: HallCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    hall = Hall(**hall_data.model_dump())
    hall_doc = hall.model_dump()
    hall_doc['created_at'] = hall_doc['created_at'].isoformat()
    await db.halls.insert_one(hall_doc)
    return hall

@api_router.put("/halls/{hall_id}", response_model=Hall)
async def update_hall(hall_id: str, hall_data: HallCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.halls.update_one(
        {"id": hall_id},
        {"$set": hall_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hall not found")
    
    updated = await db.halls.find_one({"id": hall_id}, {"_id": 0})
    return Hall(**updated)

@api_router.delete("/halls/{hall_id}")
async def delete_hall(hall_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.halls.update_one({"id": hall_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hall not found")
    return {"message": "Hall deleted"}

# ==================== MENU CATEGORY ROUTES ====================
class MenuCategoryCreate(BaseModel):
    name: str
    description: str = ""

class MenuCategoryModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/menu-categories")
async def get_menu_categories(current_user: dict = Depends(get_current_user)):
    categories = await db.menu_categories.find({"is_active": True}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/menu-categories")
async def create_menu_category(cat_data: MenuCategoryCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if category with same name exists
    existing = await db.menu_categories.find_one({"name": cat_data.name, "is_active": True}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    category = MenuCategoryModel(**cat_data.model_dump())
    cat_doc = category.model_dump()
    cat_doc['created_at'] = cat_doc['created_at'].isoformat()
    await db.menu_categories.insert_one(cat_doc)
    # Remove MongoDB _id before returning
    cat_doc.pop('_id', None)
    return cat_doc

@api_router.delete("/menu-categories/{category_id}")
async def delete_menu_category(category_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.menu_categories.update_one({"id": category_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ==================== MENU ROUTES ====================
@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu_items():
    items = await db.menu_items.find({"is_active": True}, {"_id": 0}).to_list(500)
    return [MenuItem(**i) for i in items]

@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item_data: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    item = MenuItem(**item_data.model_dump())
    item_doc = item.model_dump()
    item_doc['created_at'] = item_doc['created_at'].isoformat()
    await db.menu_items.insert_one(item_doc)
    return item

@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, item_data: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.menu_items.update_one({"id": item_id}, {"$set": item_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return MenuItem(**updated)

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.menu_items.update_one({"id": item_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# ==================== CUSTOMER ROUTES ====================
@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return [Customer(**c) for c in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    customer = Customer(**customer_data.model_dump())
    customer_doc = customer.model_dump()
    customer_doc['created_at'] = customer_doc['created_at'].isoformat()
    await db.customers.insert_one(customer_doc)
    return customer

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    result = await db.customers.update_one({"id": customer_id}, {"$set": customer_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return Customer(**updated)

# ==================== BOOKING ROUTES ====================
@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(
    status: Optional[BookingStatus] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query['status'] = status.value
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("event_date", -1).to_list(1000)
    return [Booking(**b) for b in bookings]

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return Booking(**booking)

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    # Check for slot conflicts (same hall, same date, same slot)
    existing = await db.bookings.find_one({
        "hall_id": booking_data.hall_id,
        "event_date": booking_data.event_date,
        "slot": booking_data.slot.value,
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Hall already booked for {booking_data.slot.value} slot on this date")
    
    # Get hall info (for availability only, not pricing)
    hall = await db.halls.find_one({"id": booking_data.hall_id}, {"_id": 0})
    if not hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    
    # Fetch menu items
    menu_items_list = []
    if booking_data.menu_items:
        menu_items_list = await db.menu_items.find(
            {"id": {"$in": booking_data.menu_items}, "is_addon": False},
            {"_id": 0}
        ).to_list(100)
    
    # Fetch addons
    addons_list = []
    if booking_data.addons:
        addons_list = await db.menu_items.find(
            {"id": {"$in": booking_data.addons}, "is_addon": True},
            {"_id": 0}
        ).to_list(100)
    
    # Calculate charges with GST options and custom menu prices
    charges = calculate_booking_charges(
        menu_items_list, 
        addons_list, 
        booking_data.guest_count, 
        booking_data.discount_type,
        booking_data.discount_value,
        booking_data.gst_option,
        booking_data.custom_gst_percent,
        booking_data.custom_menu_prices
    )
    
    # Calculate advance paid from payment splits or legacy advance_amount
    advance_paid = 0
    if booking_data.payment_splits:
        advance_paid = sum(p.get('amount', 0) for p in booking_data.payment_splits)
    elif booking_data.payment_received:
        advance_paid = booking_data.advance_amount
    
    balance_due = charges['total_amount'] - advance_paid
    
    # Determine payment status
    payment_status = PaymentStatus.PENDING
    if advance_paid >= charges['total_amount'] and charges['total_amount'] > 0:
        payment_status = PaymentStatus.PAID
    elif advance_paid > 0:
        payment_status = PaymentStatus.PARTIAL
    
    # Get slot times
    start_time, end_time = get_slot_times(booking_data.slot)
    
    booking = Booking(
        customer_id=booking_data.customer_id,
        hall_id=booking_data.hall_id,
        event_type=booking_data.event_type,
        event_date=booking_data.event_date,
        slot=booking_data.slot,
        start_time=start_time,
        end_time=end_time,
        guest_count=booking_data.guest_count,
        menu_items=booking_data.menu_items,
        addons=booking_data.addons,
        special_requests=booking_data.special_requests,
        custom_menu_prices=booking_data.custom_menu_prices,
        food_charge=charges['food_charge'],
        addon_charge=charges['addon_charge'],
        subtotal=charges['subtotal'],
        discount_type=booking_data.discount_type,
        discount_value=booking_data.discount_value,
        discount_amount=charges['discount_amount'],
        gst_option=booking_data.gst_option,
        gst_percent=charges['gst_percent'],
        gst_amount=charges['gst_amount'],
        total_amount=charges['total_amount'],
        payment_splits=booking_data.payment_splits,
        payment_received=booking_data.payment_received or len(booking_data.payment_splits) > 0,
        advance_paid=advance_paid,
        payment_method=booking_data.payment_method,
        balance_due=balance_due,
        payment_status=payment_status,
        linked_vendors=booking_data.linked_vendors
    )
    
    booking_doc = booking.model_dump()
    booking_doc['created_at'] = booking_doc['created_at'].isoformat()
    booking_doc['updated_at'] = booking_doc['updated_at'].isoformat()
    await db.bookings.insert_one(booking_doc)
    return booking

@api_router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(booking_id: str, update_data: BookingUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Check for slot conflict if changing hall, date, or slot
    if any(k in update_dict for k in ['hall_id', 'event_date', 'slot']):
        hall_id = update_dict.get('hall_id', existing['hall_id'])
        event_date = update_dict.get('event_date', existing['event_date'])
        slot = update_dict.get('slot', existing.get('slot', 'day'))
        
        conflict = await db.bookings.find_one({
            "id": {"$ne": booking_id},
            "hall_id": hall_id,
            "event_date": event_date,
            "slot": slot,
            "status": {"$nin": ["cancelled"]}
        }, {"_id": 0})
        
        if conflict:
            raise HTTPException(status_code=400, detail=f"Hall already booked for {slot} slot on this date")
        
        # Update slot times
        if 'slot' in update_dict:
            start_time, end_time = get_slot_times(SlotType(slot))
            update_dict['start_time'] = start_time
            update_dict['end_time'] = end_time
    
    # Recalculate charges if relevant fields changed
    if any(k in update_dict for k in ['guest_count', 'menu_items', 'addons', 'discount_type', 'discount_value', 'payment_received', 'advance_amount']):
        guest_count = update_dict.get('guest_count', existing['guest_count'])
        menu_items_ids = update_dict.get('menu_items', existing['menu_items'])
        addons_ids = update_dict.get('addons', existing['addons'])
        discount_type = update_dict.get('discount_type', existing.get('discount_type', 'percent'))
        discount_value = update_dict.get('discount_value', existing.get('discount_value', 0))
        
        # Fetch menu items
        menu_items_list = []
        if menu_items_ids:
            menu_items_list = await db.menu_items.find({"id": {"$in": menu_items_ids}, "is_addon": False}, {"_id": 0}).to_list(100)
        
        # Fetch addons
        addons_list = []
        if addons_ids:
            addons_list = await db.menu_items.find({"id": {"$in": addons_ids}, "is_addon": True}, {"_id": 0}).to_list(100)
        
        # Calculate charges
        charges = calculate_booking_charges(menu_items_list, addons_list, guest_count, discount_type, discount_value)
        
        # Calculate advance paid
        payment_received = update_dict.get('payment_received', existing.get('payment_received', False))
        advance_amount = update_dict.get('advance_amount', existing.get('advance_paid', 0))
        advance_paid = advance_amount if payment_received else 0
        
        balance_due = charges['total_amount'] - advance_paid
        
        # Determine payment status
        payment_status = 'pending'
        if advance_paid >= charges['total_amount'] and charges['total_amount'] > 0:
            payment_status = 'paid'
        elif advance_paid > 0:
            payment_status = 'partial'
        
        update_dict.update({
            'food_charge': charges['food_charge'],
            'addon_charge': charges['addon_charge'],
            'subtotal': charges['subtotal'],
            'discount_type': discount_type,
            'discount_value': discount_value,
            'discount_amount': charges['discount_amount'],
            'gst_percent': charges['gst_percent'],
            'gst_amount': charges['gst_amount'],
            'total_amount': charges['total_amount'],
            'payment_received': payment_received,
            'advance_paid': advance_paid,
            'balance_due': balance_due,
            'payment_status': payment_status
        })
    
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.bookings.update_one({"id": booking_id}, {"$set": update_dict})
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return Booking(**updated)

@api_router.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking cancelled"}

# ==================== PAYMENT ROUTES ====================
@api_router.get("/payments", response_model=List[Payment])
async def get_payments(booking_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if booking_id:
        query['booking_id'] = booking_id
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Payment(**p) for p in payments]

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": payment_data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Set payment_date to today if not provided
    payment_dict = payment_data.model_dump()
    if not payment_dict.get('payment_date'):
        payment_dict['payment_date'] = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    payment = Payment(**payment_dict)
    payment_doc = payment.model_dump()
    payment_doc['created_at'] = payment_doc['created_at'].isoformat()
    await db.payments.insert_one(payment_doc)
    
    # Update booking payment status and split
    new_advance = booking['advance_paid'] + payment_data.amount
    new_balance = booking['total_amount'] - new_advance
    
    # Update payment mode split
    payment_mode = payment_data.payment_mode.value
    payment_cash = booking.get('payment_cash', 0)
    payment_credit = booking.get('payment_credit', 0)
    payment_upi = booking.get('payment_upi', 0)
    
    if payment_mode == 'cash':
        payment_cash += payment_data.amount
    elif payment_mode == 'credit':
        payment_credit += payment_data.amount
    elif payment_mode == 'upi':
        payment_upi += payment_data.amount
    
    payment_status = PaymentStatus.PENDING.value
    if new_balance <= 0:
        payment_status = PaymentStatus.PAID.value
        new_balance = 0
    elif new_advance > 0:
        payment_status = PaymentStatus.PARTIAL.value
    
    await db.bookings.update_one(
        {"id": payment_data.booking_id},
        {"$set": {
            "advance_paid": new_advance,
            "balance_due": new_balance,
            "payment_cash": payment_cash,
            "payment_credit": payment_credit,
            "payment_upi": payment_upi,
            "payment_status": payment_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return payment

# ==================== PARTY EXPENSES (ADMIN ONLY) ====================
@api_router.get("/party-expenses/{booking_id}")
async def get_party_expenses(booking_id: str, current_user: dict = Depends(get_current_user)):
    # Only admin can see expenses
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    expenses = await db.party_expenses.find({"booking_id": booking_id}, {"_id": 0}).to_list(100)
    return expenses

@api_router.post("/party-expenses", response_model=PartyExpense)
async def create_party_expense(expense_data: PartyExpenseCreate, current_user: dict = Depends(get_current_user)):
    # Only admin can add expenses
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    booking = await db.bookings.find_one({"id": expense_data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    expense = PartyExpense(**expense_data.model_dump())
    expense_doc = expense.model_dump()
    expense_doc['created_at'] = expense_doc['created_at'].isoformat()
    await db.party_expenses.insert_one(expense_doc)
    
    # Update booking total expenses and net profit
    all_expenses = await db.party_expenses.find({"booking_id": expense_data.booking_id}, {"_id": 0}).to_list(100)
    total_expenses = sum(e['amount'] for e in all_expenses)
    net_profit = booking['total_amount'] - total_expenses
    
    await db.bookings.update_one(
        {"id": expense_data.booking_id},
        {"$set": {
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return expense

@api_router.delete("/party-expenses/{expense_id}")
async def delete_party_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    # Only admin can delete expenses
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    expense = await db.party_expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    booking_id = expense['booking_id']
    await db.party_expenses.delete_one({"id": expense_id})
    
    # Recalculate booking expenses
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if booking:
        all_expenses = await db.party_expenses.find({"booking_id": booking_id}, {"_id": 0}).to_list(100)
        total_expenses = sum(e['amount'] for e in all_expenses)
        net_profit = booking['total_amount'] - total_expenses
        
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {
                "total_expenses": total_expenses,
                "net_profit": net_profit,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return {"message": "Expense deleted"}

# ==================== PARTY PLANNING ROUTES (ADMIN ONLY) ====================
@api_router.get("/party-plans")
async def get_party_plans(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    plans = await db.party_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return plans

@api_router.get("/party-plans/{booking_id}")
async def get_party_plan(booking_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    plan = await db.party_plans.find_one({"booking_id": booking_id}, {"_id": 0})
    return plan

@api_router.post("/party-plans")
async def create_party_plan(plan_data: PartyPlanCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if booking exists and is confirmed
    booking = await db.bookings.find_one({"id": plan_data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if plan already exists for this booking
    existing = await db.party_plans.find_one({"booking_id": plan_data.booking_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Party plan already exists for this booking")
    
    # Calculate total staff charges
    total_staff_charges = sum(s.get('charge', 0) for s in plan_data.staff_assignments)
    
    plan = PartyPlan(
        booking_id=plan_data.booking_id,
        dj_vendor_id=plan_data.dj_vendor_id,
        decor_vendor_id=plan_data.decor_vendor_id,
        catering_vendor_id=plan_data.catering_vendor_id,
        custom_vendors=plan_data.custom_vendors,
        staff_assignments=plan_data.staff_assignments,
        total_staff_charges=total_staff_charges,
        notes=plan_data.notes
    )
    
    plan_doc = plan.model_dump()
    plan_doc['created_at'] = plan_doc['created_at'].isoformat()
    plan_doc['updated_at'] = plan_doc['updated_at'].isoformat()
    await db.party_plans.insert_one(plan_doc)
    
    # Auto-create expense for staff charges if > 0
    if total_staff_charges > 0:
        staff_expense = PartyExpense(
            booking_id=plan_data.booking_id,
            expense_name="Staff & Waiter Charges",
            amount=total_staff_charges,
            notes="Auto-generated from party planning"
        )
        expense_doc = staff_expense.model_dump()
        expense_doc['created_at'] = expense_doc['created_at'].isoformat()
        await db.party_expenses.insert_one(expense_doc)
        
        # Update booking expenses
        all_expenses = await db.party_expenses.find({"booking_id": plan_data.booking_id}, {"_id": 0}).to_list(100)
        total_expenses = sum(e['amount'] for e in all_expenses)
        net_profit = booking['total_amount'] - total_expenses
        
        await db.bookings.update_one(
            {"id": plan_data.booking_id},
            {"$set": {
                "total_expenses": total_expenses,
                "net_profit": net_profit,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    # Link vendors to booking
    all_vendors = [plan_data.dj_vendor_id, plan_data.decor_vendor_id, plan_data.catering_vendor_id] + plan_data.custom_vendors
    linked_vendors = [v for v in all_vendors if v]
    if linked_vendors:
        await db.bookings.update_one(
            {"id": plan_data.booking_id},
            {"$set": {"linked_vendors": linked_vendors}}
        )
    
    plan_doc.pop('_id', None)
    return plan_doc

@api_router.put("/party-plans/{booking_id}")
async def update_party_plan(booking_id: str, plan_data: PartyPlanCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.party_plans.find_one({"booking_id": booking_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Party plan not found")
    
    # Calculate total staff charges
    total_staff_charges = sum(s.get('charge', 0) for s in plan_data.staff_assignments)
    
    update_data = {
        "dj_vendor_id": plan_data.dj_vendor_id,
        "decor_vendor_id": plan_data.decor_vendor_id,
        "catering_vendor_id": plan_data.catering_vendor_id,
        "custom_vendors": plan_data.custom_vendors,
        "staff_assignments": plan_data.staff_assignments,
        "total_staff_charges": total_staff_charges,
        "notes": plan_data.notes,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.party_plans.update_one({"booking_id": booking_id}, {"$set": update_data})
    
    # Link vendors to booking
    all_vendors = [plan_data.dj_vendor_id, plan_data.decor_vendor_id, plan_data.catering_vendor_id] + plan_data.custom_vendors
    linked_vendors = [v for v in all_vendors if v]
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"linked_vendors": linked_vendors}}
    )
    
    return {"message": "Party plan updated"}

# ==================== CONFIRMED BOOKINGS FOR PARTY PLANNING ====================
@api_router.get("/confirmed-bookings")
async def get_confirmed_bookings(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    bookings = await db.bookings.find(
        {"status": {"$in": ["confirmed", "completed"]}},
        {"_id": 0}
    ).sort("event_date", 1).to_list(100)
    
    # Enrich with party plan status
    for booking in bookings:
        plan = await db.party_plans.find_one({"booking_id": booking['id']}, {"_id": 0})
        booking['has_party_plan'] = plan is not None
        booking['party_plan'] = plan
    
    return bookings

# ==================== VENDOR PAYMENTS & BALANCE SHEET (ADMIN ONLY) ====================
@api_router.get("/vendor-payments")
async def get_vendor_payments(vendor_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    # Only admin can see vendor payments
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if vendor_id:
        query['vendor_id'] = vendor_id
    payments = await db.vendor_payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return payments

@api_router.post("/vendor-payments", response_model=VendorPayment)
async def create_vendor_payment(payment_data: VendorPaymentCreate, current_user: dict = Depends(get_current_user)):
    # Only admin can add vendor payments
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    vendor = await db.vendors.find_one({"id": payment_data.vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    payment = VendorPayment(**payment_data.model_dump())
    payment_doc = payment.model_dump()
    payment_doc['created_at'] = payment_doc['created_at'].isoformat()
    await db.vendor_payments.insert_one(payment_doc)
    
    # Update vendor balance sheet
    total_paid = vendor.get('total_paid', 0) + payment_data.amount
    outstanding = vendor.get('total_payable', 0) - total_paid
    
    await db.vendors.update_one(
        {"id": payment_data.vendor_id},
        {"$set": {
            "total_paid": total_paid,
            "outstanding_balance": outstanding
        }}
    )
    
    return payment

@api_router.get("/vendor-balance-sheet")
async def get_vendor_balance_sheet(current_user: dict = Depends(get_current_user)):
    # Only admin can see vendor balance sheet
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    vendors = await db.vendors.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    balance_sheet = []
    for vendor in vendors:
        # Get all payments for this vendor
        payments = await db.vendor_payments.find({"vendor_id": vendor['id']}, {"_id": 0}).to_list(100)
        
        # Calculate total paid from actual payments
        total_paid = sum(p.get('amount', 0) for p in payments)
        
        # Count unique bookings linked to this vendor through payments
        linked_bookings = set()
        for p in payments:
            if p.get('booking_id'):
                linked_bookings.add(p['booking_id'])
        
        # Also count from vendor assignments
        assignments = await db.vendor_assignments.find({"vendor_id": vendor['id']}, {"_id": 0}).to_list(100)
        for a in assignments:
            if a.get('booking_id'):
                linked_bookings.add(a['booking_id'])
        
        parties_count = len(linked_bookings)
        total_payable = vendor.get('total_payable', 0)
        outstanding = max(0, total_payable - total_paid)
        
        # Update vendor record with calculated values
        await db.vendors.update_one(
            {"id": vendor['id']},
            {"$set": {
                "total_paid": total_paid,
                "outstanding_balance": outstanding,
                "total_events": parties_count
            }}
        )
        
        balance_sheet.append({
            "vendor_id": vendor['id'],
            "vendor_name": vendor['name'],
            "vendor_type": vendor['vendor_type'],
            "phone": vendor.get('phone', ''),
            "total_payable": total_payable,
            "total_paid": total_paid,
            "outstanding_balance": outstanding,
            "parties_count": parties_count,
            "payments": payments
        })
    
    return balance_sheet

@api_router.put("/vendors/{vendor_id}/add-payable")
async def add_vendor_payable(vendor_id: str, amount: float, description: str = "", current_user: dict = Depends(get_current_user)):
    """Add payable amount to vendor (from party expense)"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    new_payable = vendor.get('total_payable', 0) + amount
    outstanding = new_payable - vendor.get('total_paid', 0)
    
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "total_payable": new_payable,
            "outstanding_balance": outstanding,
            "total_events": vendor.get('total_events', 0) + 1
        }}
    )
    
    return {"message": "Payable amount added", "new_total_payable": new_payable, "outstanding": outstanding}

# ==================== ENQUIRY ROUTES (PUBLIC) ====================
@api_router.post("/enquiries", response_model=Enquiry)
async def create_enquiry(enquiry_data: EnquiryCreate):
    enquiry = Enquiry(**enquiry_data.model_dump())
    enquiry_doc = enquiry.model_dump()
    enquiry_doc['created_at'] = enquiry_doc['created_at'].isoformat()
    await db.enquiries.insert_one(enquiry_doc)
    return enquiry

@api_router.get("/enquiries", response_model=List[Enquiry])
async def get_enquiries(current_user: dict = Depends(get_current_user)):
    enquiries = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Enquiry(**e) for e in enquiries]

@api_router.put("/enquiries/{enquiry_id}/contacted")
async def mark_enquiry_contacted(enquiry_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.enquiries.update_one({"id": enquiry_id}, {"$set": {"is_contacted": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return {"message": "Enquiry marked as contacted"}

# ==================== CALENDAR ROUTES ====================
@api_router.get("/calendar")
async def get_calendar_events(month: int, year: int, current_user: dict = Depends(get_current_user)):
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    bookings = await db.bookings.find({
        "event_date": {"$gte": start_date, "$lt": end_date},
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(500)
    
    events = []
    for booking in bookings:
        customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
        hall = await db.halls.find_one({"id": booking['hall_id']}, {"_id": 0})
        events.append({
            "id": booking['id'],
            "title": f"{customer['name'] if customer else 'Unknown'} - {booking['event_type'].title()}",
            "date": booking['event_date'],
            "start_time": booking['start_time'],
            "end_time": booking['end_time'],
            "hall": hall['name'] if hall else 'Unknown',
            "status": booking['status'],
            "guest_count": booking['guest_count']
        })
    
    return events

# Check hall availability (public)
@api_router.get("/availability")
async def check_availability(date: str, hall_id: Optional[str] = None):
    query = {
        "event_date": date,
        "status": {"$nin": ["cancelled"]}
    }
    if hall_id:
        query['hall_id'] = hall_id
    
    booked = await db.bookings.find(query, {"_id": 0}).to_list(100)
    halls = await db.halls.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    booked_hall_ids = [b['hall_id'] for b in booked]
    available_halls = [h for h in halls if h['id'] not in booked_hall_ids]
    
    return {
        "date": date,
        "available_halls": [Hall(**h) for h in available_halls],
        "booked_slots": booked
    }

# ==================== DASHBOARD / ANALYTICS ====================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total bookings this month
    total_bookings = await db.bookings.count_documents({
        "created_at": {"$gte": current_month_start.isoformat()}
    })
    
    # Upcoming events
    today = now.strftime("%Y-%m-%d")
    upcoming_events = await db.bookings.count_documents({
        "event_date": {"$gte": today},
        "status": {"$in": ["enquiry", "confirmed"]}
    })
    
    # Monthly revenue
    bookings = await db.bookings.find({
        "created_at": {"$gte": current_month_start.isoformat()},
        "status": {"$ne": "cancelled"}
    }, {"_id": 0, "total_amount": 1, "advance_paid": 1}).to_list(1000)
    
    monthly_revenue = sum(b.get('advance_paid', 0) for b in bookings)
    
    # Pending payments
    pending_payments = await db.bookings.count_documents({
        "payment_status": {"$in": ["pending", "partial"]},
        "status": {"$ne": "cancelled"}
    })
    
    # Recent bookings
    recent_bookings = await db.bookings.find(
        {"status": {"$ne": "cancelled"}},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Enrich with customer/hall info
    for booking in recent_bookings:
        customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
        hall = await db.halls.find_one({"id": booking['hall_id']}, {"_id": 0})
        booking['customer_name'] = customer['name'] if customer else 'Unknown'
        booking['hall_name'] = hall['name'] if hall else 'Unknown'
    
    # New enquiries count
    new_enquiries = await db.enquiries.count_documents({"is_contacted": False})
    
    return {
        "total_bookings": total_bookings,
        "upcoming_events": upcoming_events,
        "monthly_revenue": monthly_revenue,
        "pending_payments": pending_payments,
        "new_enquiries": new_enquiries,
        "recent_bookings": recent_bookings
    }

@api_router.get("/dashboard/revenue-chart")
async def get_revenue_chart(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    months_data = []
    
    for i in range(6):
        month_date = now - timedelta(days=30 * i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year + 1, month=1, day=1)
        else:
            month_end = month_date.replace(month=month_date.month + 1, day=1)
        
        bookings = await db.bookings.find({
            "created_at": {"$gte": month_start.isoformat(), "$lt": month_end.isoformat()},
            "status": {"$ne": "cancelled"}
        }, {"_id": 0, "advance_paid": 1}).to_list(1000)
        
        revenue = sum(b.get('advance_paid', 0) for b in bookings)
        months_data.append({
            "month": month_start.strftime("%b"),
            "revenue": revenue
        })
    
    return list(reversed(months_data))

@api_router.get("/dashboard/event-distribution")
async def get_event_distribution(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"status": {"$ne": "cancelled"}}},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}}
    ]
    result = await db.bookings.aggregate(pipeline).to_list(100)
    return [{"event_type": r['_id'], "count": r['count']} for r in result]

# ==================== PDF INVOICE ====================
@api_router.get("/bookings/{booking_id}/invoice")
async def generate_invoice(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
    hall = await db.halls.find_one({"id": booking['hall_id']}, {"_id": 0})
    
    # Fetch menu items for itemized breakdown
    menu_items_list = []
    if booking.get('menu_items'):
        menu_items_list = await db.menu_items.find(
            {"id": {"$in": booking['menu_items']}, "is_addon": False},
            {"_id": 0}
        ).to_list(100)
    
    # Fetch addons for itemized breakdown
    addons_list = []
    if booking.get('addons'):
        addons_list = await db.menu_items.find(
            {"id": {"$in": booking['addons']}, "is_addon": True},
            {"_id": 0}
        ).to_list(100)
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30, bottomMargin=30)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#800000'), alignment=1)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, textColor=colors.HexColor('#666666'), alignment=1)
    section_style = ParagraphStyle('Section', parent=styles['Heading3'], fontSize=12, textColor=colors.HexColor('#800000'))
    
    # Header
    story.append(Paragraph("Mayur Simran Banquet", title_style))
    story.append(Paragraph("Rajpura, Punjab, India", subtitle_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"<b>Invoice #{booking['booking_number']}</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    # Customer info
    slot_display = booking.get('slot', 'day').upper()
    slot_time = "10:00 AM - 5:00 PM" if slot_display == "DAY" else "8:00 PM - 1:00 AM"
    customer_info = [
        ["Customer:", customer['name'] if customer else 'N/A'],
        ["Phone:", customer['phone'] if customer else 'N/A'],
        ["Email:", customer['email'] if customer else 'N/A'],
        ["Event Date:", booking['event_date']],
        ["Slot:", f"{slot_display} ({slot_time})"],
        ["Event Type:", booking['event_type'].title()],
        ["Hall:", hall['name'] if hall else 'N/A'],
        ["Guests:", str(booking['guest_count'])]
    ]
    
    info_table = Table(customer_info, colWidths=[100, 300])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))
    
    # Food Items Breakdown
    if menu_items_list:
        story.append(Paragraph("Food Items", section_style))
        food_data = [["Item", "Qty", "Rate/Plate", "Amount"]]
        for item in menu_items_list:
            qty = booking['guest_count']
            rate = item['price_per_plate']
            amount = qty * rate
            food_data.append([
                item['name'],
                str(qty),
                f"Rs. {rate:,.2f}",
                f"Rs. {amount:,.2f}"
            ])
        
        food_table = Table(food_data, colWidths=[200, 50, 100, 100])
        food_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(food_table)
        story.append(Spacer(1, 10))
    
    # Add-ons Breakdown
    if addons_list:
        story.append(Paragraph("Add-on Services", section_style))
        addon_data = [["Service", "Amount"]]
        for addon in addons_list:
            addon_data.append([addon['name'], f"Rs. {addon['price_per_plate']:,.2f}"])
        
        addon_table = Table(addon_data, colWidths=[300, 150])
        addon_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(addon_table)
        story.append(Spacer(1, 15))
    
    # Summary with GST
    story.append(Paragraph("Summary", section_style))
    gst_percent = booking.get('gst_percent', 5.0)
    gst_amount = booking.get('gst_amount', 0)
    
    summary_data = [
        ["Description", "Amount"],
        ["Food Charges", f"Rs. {booking['food_charge']:,.2f}"],
        ["Add-on Services", f"Rs. {booking['addon_charge']:,.2f}"],
        ["Subtotal", f"Rs. {booking['subtotal']:,.2f}"],
    ]
    
    if booking['discount_percent'] > 0:
        summary_data.append([f"Discount ({booking['discount_percent']}%)", f"-Rs. {booking['discount_amount']:,.2f}"])
    
    summary_data.extend([
        [f"GST ({gst_percent}%)", f"Rs. {gst_amount:,.2f}"],
        ["Total Amount", f"Rs. {booking['total_amount']:,.2f}"],
    ])
    
    summary_table = Table(summary_data, colWidths=[300, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#800000')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#DDDDDD')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#FFF7E8')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))
    
    # Payment Details
    story.append(Paragraph("Payment Details", section_style))
    payment_data = [
        ["Payment Mode", "Amount"],
        ["Cash", f"Rs. {booking.get('payment_cash', 0):,.2f}"],
        ["Credit/Card", f"Rs. {booking.get('payment_credit', 0):,.2f}"],
        ["UPI", f"Rs. {booking.get('payment_upi', 0):,.2f}"],
        ["Total Paid", f"Rs. {booking['advance_paid']:,.2f}"],
        ["Balance Due", f"Rs. {booking['balance_due']:,.2f}"],
    ]
    
    payment_table = Table(payment_data, colWidths=[300, 150])
    payment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#DDDDDD')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#FEF2F2') if booking['balance_due'] > 0 else colors.HexColor('#ECFDF5')),
    ]))
    story.append(payment_table)
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("Thank you for choosing Mayur Simran Banquet!", subtitle_style))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{booking['booking_number']}.pdf"}
    )

# ==================== KITCHEN/OPERATIONS INVOICE (NO PRICING) ====================
@api_router.get("/bookings/{booking_id}/kitchen-invoice")
async def generate_kitchen_invoice(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Generate kitchen invoice with food items, event details, NO pricing"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
    hall = await db.halls.find_one({"id": booking['hall_id']}, {"_id": 0})
    
    # Fetch menu items
    menu_items_list = []
    if booking.get('menu_items'):
        menu_items_list = await db.menu_items.find(
            {"id": {"$in": booking['menu_items']}, "is_addon": False},
            {"_id": 0}
        ).to_list(100)
    
    # Fetch addons
    addons_list = []
    if booking.get('addons'):
        addons_list = await db.menu_items.find(
            {"id": {"$in": booking['addons']}, "is_addon": True},
            {"_id": 0}
        ).to_list(100)
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30, bottomMargin=30)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#1e40af'), alignment=1)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, textColor=colors.HexColor('#666666'), alignment=1)
    section_style = ParagraphStyle('Section', parent=styles['Heading3'], fontSize=14, textColor=colors.HexColor('#1e40af'))
    
    # Header
    story.append(Paragraph("KITCHEN ORDER", title_style))
    story.append(Paragraph("Operations Copy - NO PRICING", subtitle_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"<b>Booking: {booking['booking_number']}</b>", styles['Heading2']))
    story.append(Spacer(1, 15))
    
    # Event Details
    slot_display = booking.get('slot', 'day').upper()
    slot_time = "10:00 AM - 5:00 PM" if slot_display == "DAY" else "8:00 PM - 1:00 AM"
    
    event_info = [
        ["EVENT DATE:", booking['event_date']],
        ["TIME SLOT:", f"{slot_display} ({slot_time})"],
        ["EVENT TYPE:", booking['event_type'].upper()],
        ["HALL/VENUE:", hall['name'] if hall else 'N/A'],
        ["GUEST COUNT:", str(booking['guest_count'])],
        ["CUSTOMER:", customer['name'] if customer else 'N/A'],
        ["PHONE:", customer['phone'] if customer else 'N/A'],
    ]
    
    info_table = Table(event_info, colWidths=[120, 330])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#dbeafe')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#93c5fd')),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 25))
    
    # Food Items (NO PRICING)
    if menu_items_list:
        story.append(Paragraph("FOOD ITEMS", section_style))
        story.append(Spacer(1, 10))
        
        # Group by category
        categories = {}
        for item in menu_items_list:
            cat = item.get('category', 'Other')
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item)
        
        food_data = [["#", "Item Name", "Category", "Type", "Qty"]]
        idx = 1
        for cat, items in categories.items():
            for item in items:
                food_type = "VEG" if item.get('menu_type') == 'veg' else "NON-VEG"
                food_data.append([
                    str(idx),
                    item['name'],
                    cat,
                    food_type,
                    str(booking['guest_count'])
                ])
                idx += 1
        
        food_table = Table(food_data, colWidths=[30, 200, 100, 70, 50])
        food_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#DDDDDD')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f9ff')]),
        ]))
        story.append(food_table)
        story.append(Spacer(1, 20))
    
    # Add-ons/Services
    if addons_list:
        story.append(Paragraph("SERVICES & ADD-ONS", section_style))
        story.append(Spacer(1, 10))
        addon_data = [["#", "Service"]]
        for idx, addon in enumerate(addons_list, 1):
            addon_data.append([str(idx), addon['name']])
        
        addon_table = Table(addon_data, colWidths=[30, 420])
        addon_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#DDDDDD')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(addon_table)
        story.append(Spacer(1, 20))
    
    # Special Requests
    if booking.get('special_requests'):
        story.append(Paragraph("SPECIAL REQUESTS", section_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph(booking['special_requests'], styles['Normal']))
        story.append(Spacer(1, 20))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(Paragraph("— Kitchen Operations Copy —", subtitle_style))
    story.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}", subtitle_style))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=kitchen_{booking['booking_number']}.pdf"}
    )

# ==================== EXPORT REPORTS ====================
@api_router.get("/admin/reports/export-pdf")
async def export_financial_report_pdf(
    start_date: str,
    end_date: str,
    current_user: dict = Depends(get_current_user)
):
    """Export financial report as PDF"""
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    
    # Fetch report data
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    bookings = await db.bookings.find({
        "event_date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(b.get('total_amount', 0) for b in bookings)
    collected = sum(b.get('advance_paid', 0) for b in bookings)
    pending = total_revenue - collected
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#7C3AED'))
    story.append(Paragraph("Financial Report", title_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Period: {start_date} to {end_date}", styles['Normal']))
    story.append(Spacer(1, 24))
    
    # Summary table
    summary_data = [
        ["Metric", "Value"],
        ["Total Revenue", f"Rs. {total_revenue:,.2f}"],
        ["Amount Collected", f"Rs. {collected:,.2f}"],
        ["Pending Collection", f"Rs. {pending:,.2f}"],
        ["Total Bookings", str(len(bookings))]
    ]
    
    summary_table = Table(summary_data, colWidths=[200, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7C3AED')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F9FAFB')),
    ]))
    story.append(summary_table)
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=financial_report_{start_date}_{end_date}.pdf"}
    )

@api_router.get("/admin/analytics/export")
async def export_analytics_report(
    start_date: str,
    end_date: str,
    current_user: dict = Depends(get_current_user)
):
    """Export analytics report as PDF"""
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    
    # Fetch hall utilization data
    halls = await db.halls.find({"is_active": True}, {"_id": 0}).to_list(100)
    bookings = await db.bookings.find({
        "event_date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(1000)
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#7C3AED'))
    story.append(Paragraph("Analytics Report", title_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Period: {start_date} to {end_date}", styles['Normal']))
    story.append(Spacer(1, 24))
    
    # Hall performance table
    hall_data = [["Hall Name", "Capacity", "Bookings", "Revenue"]]
    for hall in halls:
        hall_bookings = [b for b in bookings if b.get('hall_id') == hall['id']]
        revenue = sum(b.get('total_amount', 0) for b in hall_bookings)
        hall_data.append([
            hall['name'],
            str(hall['capacity']),
            str(len(hall_bookings)),
            f"Rs. {revenue:,.2f}"
        ])
    
    hall_table = Table(hall_data, colWidths=[150, 80, 80, 120])
    hall_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7C3AED')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F9FAFB')),
    ]))
    story.append(hall_table)
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=analytics_report_{start_date}_{end_date}.pdf"}
    )

# ==================== VENDOR MANAGEMENT ====================
@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(current_user: dict = Depends(get_current_user)):
    vendors = await db.vendors.find({"is_active": True}, {"_id": 0}).to_list(500)
    return [Vendor(**v) for v in vendors]

@api_router.post("/vendors", response_model=Vendor)
async def create_vendor(vendor_data: VendorCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    vendor = Vendor(**vendor_data.model_dump())
    vendor_doc = vendor.model_dump()
    vendor_doc['created_at'] = vendor_doc['created_at'].isoformat()
    await db.vendors.insert_one(vendor_doc)
    return vendor

@api_router.put("/vendors/{vendor_id}", response_model=Vendor)
async def update_vendor(vendor_id: str, vendor_data: VendorCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.vendors.update_one({"id": vendor_id}, {"$set": vendor_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    updated = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    return Vendor(**updated)

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.vendors.update_one({"id": vendor_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor deleted"}

# Vendor Assignments
@api_router.get("/vendor-assignments")
async def get_vendor_assignments(booking_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if booking_id:
        query['booking_id'] = booking_id
    assignments = await db.vendor_assignments.find(query, {"_id": 0}).to_list(500)
    # Enrich with vendor info
    for assignment in assignments:
        vendor = await db.vendors.find_one({"id": assignment['vendor_id']}, {"_id": 0})
        assignment['vendor_name'] = vendor['name'] if vendor else 'Unknown'
        assignment['vendor_type'] = vendor['vendor_type'] if vendor else 'unknown'
    return assignments

@api_router.post("/vendor-assignments")
async def create_vendor_assignment(data: VendorAssignmentCreate, current_user: dict = Depends(get_current_user)):
    assignment = VendorAssignment(
        **data.model_dump(),
        balance_due=data.agreed_amount - data.advance_paid
    )
    if data.advance_paid >= data.agreed_amount:
        assignment.payment_status = VendorPaymentStatus.PAID
    elif data.advance_paid > 0:
        assignment.payment_status = VendorPaymentStatus.PARTIAL
    
    assignment_doc = assignment.model_dump()
    assignment_doc['created_at'] = assignment_doc['created_at'].isoformat()
    await db.vendor_assignments.insert_one(assignment_doc)
    
    # Update vendor stats
    await db.vendors.update_one(
        {"id": data.vendor_id},
        {"$inc": {"total_events": 1, "total_earned": data.agreed_amount}}
    )
    return assignment

@api_router.put("/vendor-assignments/{assignment_id}/payment")
async def update_vendor_payment(assignment_id: str, amount: float, current_user: dict = Depends(get_current_user)):
    assignment = await db.vendor_assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    new_advance = assignment['advance_paid'] + amount
    new_balance = assignment['agreed_amount'] - new_advance
    
    payment_status = VendorPaymentStatus.PENDING.value
    if new_balance <= 0:
        payment_status = VendorPaymentStatus.PAID.value
        new_balance = 0
    elif new_advance > 0:
        payment_status = VendorPaymentStatus.PARTIAL.value
    
    await db.vendor_assignments.update_one(
        {"id": assignment_id},
        {"$set": {"advance_paid": new_advance, "balance_due": new_balance, "payment_status": payment_status}}
    )
    return {"message": "Payment updated"}

# ==================== EXPENSE MANAGEMENT ====================
@api_router.get("/expenses")
async def get_expenses(booking_id: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if booking_id:
        query['booking_id'] = booking_id
    if start_date and end_date:
        query['date'] = {"$gte": start_date, "$lte": end_date}
    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return expenses

@api_router.post("/expenses")
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'staff']:
        raise HTTPException(status_code=403, detail="Not authorized")
    expense = Expense(**expense_data.model_dump())
    expense_doc = expense.model_dump()
    expense_doc['created_at'] = expense_doc['created_at'].isoformat()
    await db.expenses.insert_one(expense_doc)
    return expense

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}

# ==================== ALERTS SYSTEM ====================
@api_router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    # Generate real-time alerts based on current data
    alerts = []
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Payment overdue alerts (events passed but balance due)
    overdue_bookings = await db.bookings.find({
        "event_date": {"$lt": today},
        "balance_due": {"$gt": 0},
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0}).to_list(100)
    
    for booking in overdue_bookings:
        customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
        alerts.append({
            "id": f"alert-overdue-{booking['id']}",
            "alert_type": "payment_overdue",
            "priority": "high",
            "title": "Payment Overdue",
            "message": f"{customer['name'] if customer else 'Customer'} has ₹{booking['balance_due']:,.0f} outstanding for event on {booking['event_date']}",
            "booking_id": booking['id'],
            "is_resolved": False
        })
    
    # Events tomorrow reminder
    tomorrow_events = await db.bookings.find({
        "event_date": tomorrow,
        "status": {"$in": ["enquiry", "confirmed"]}
    }, {"_id": 0}).to_list(50)
    
    for booking in tomorrow_events:
        customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
        hall = await db.halls.find_one({"id": booking['hall_id']}, {"_id": 0})
        alerts.append({
            "id": f"alert-tomorrow-{booking['id']}",
            "alert_type": "event_tomorrow",
            "priority": "high",
            "title": "Event Tomorrow",
            "message": f"{booking['event_type'].title()} for {customer['name'] if customer else 'Customer'} at {hall['name'] if hall else 'Hall'} tomorrow",
            "booking_id": booking['id'],
            "is_resolved": False
        })
    
    # Events without menu assigned
    no_menu = await db.bookings.find({
        "event_date": {"$gte": today},
        "menu_items": {"$size": 0},
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0}).to_list(50)
    
    for booking in no_menu:
        customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
        alerts.append({
            "id": f"alert-nomenu-{booking['id']}",
            "alert_type": "no_menu_assigned",
            "priority": "medium",
            "title": "No Menu Assigned",
            "message": f"Event for {customer['name'] if customer else 'Customer'} on {booking['event_date']} has no menu selected",
            "booking_id": booking['id'],
            "is_resolved": False
        })
    
    # Low advance (less than 30%)
    low_advance = await db.bookings.find({
        "event_date": {"$gte": today},
        "status": {"$in": ["confirmed"]},
        "$expr": {"$lt": [{"$divide": ["$advance_paid", "$total_amount"]}, 0.3]}
    }, {"_id": 0}).to_list(50)
    
    for booking in low_advance:
        if booking['total_amount'] > 0:
            customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
            percent = (booking['advance_paid'] / booking['total_amount']) * 100
            alerts.append({
                "id": f"alert-lowadv-{booking['id']}",
                "alert_type": "low_advance",
                "priority": "medium",
                "title": "Low Advance Payment",
                "message": f"{customer['name'] if customer else 'Customer'} has paid only {percent:.0f}% advance (₹{booking['advance_paid']:,.0f} of ₹{booking['total_amount']:,.0f})",
                "booking_id": booking['id'],
                "is_resolved": False
            })
    
    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    alerts.sort(key=lambda x: priority_order.get(x['priority'], 3))
    
    return alerts

# ==================== HALL UTILIZATION ANALYTICS ====================
@api_router.get("/analytics/hall-utilization")
async def get_hall_utilization(start_date: str, end_date: str, current_user: dict = Depends(get_current_user)):
    halls = await db.halls.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    # Calculate date range
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    total_days = (end - start).days + 1
    
    hall_stats = []
    for hall in halls:
        # Get bookings for this hall in date range
        bookings = await db.bookings.find({
            "hall_id": hall['id'],
            "event_date": {"$gte": start_date, "$lte": end_date},
            "status": {"$nin": ["cancelled"]}
        }, {"_id": 0}).to_list(1000)
        
        booked_days = len(set(b['event_date'] for b in bookings))
        total_revenue = sum(b.get('total_amount', 0) for b in bookings)
        total_collected = sum(b.get('advance_paid', 0) for b in bookings)
        
        occupancy_rate = (booked_days / total_days * 100) if total_days > 0 else 0
        
        hall_stats.append({
            "hall_id": hall['id'],
            "hall_name": hall['name'],
            "capacity": hall['capacity'],
            "total_bookings": len(bookings),
            "booked_days": booked_days,
            "idle_days": total_days - booked_days,
            "occupancy_rate": round(occupancy_rate, 1),
            "total_revenue": total_revenue,
            "total_collected": total_collected,
            "avg_booking_value": round(total_revenue / len(bookings), 0) if bookings else 0
        })
    
    # Sort by revenue descending
    hall_stats.sort(key=lambda x: x['total_revenue'], reverse=True)
    
    return {
        "period": {"start": start_date, "end": end_date, "total_days": total_days},
        "halls": hall_stats,
        "best_performing": hall_stats[0] if hall_stats else None,
        "total_revenue": sum(h['total_revenue'] for h in hall_stats),
        "overall_occupancy": round(sum(h['booked_days'] for h in hall_stats) / (total_days * len(halls)) * 100, 1) if halls else 0
    }

@api_router.get("/analytics/peak-seasons")
async def get_peak_seasons(year: int, current_user: dict = Depends(get_current_user)):
    # Aggregate bookings by month
    pipeline = [
        {"$match": {
            "event_date": {"$regex": f"^{year}"},
            "status": {"$nin": ["cancelled"]}
        }},
        {"$addFields": {
            "month": {"$substr": ["$event_date", 5, 2]}
        }},
        {"$group": {
            "_id": "$month",
            "booking_count": {"$sum": 1},
            "total_revenue": {"$sum": "$total_amount"},
            "total_guests": {"$sum": "$guest_count"}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    monthly_data = await db.bookings.aggregate(pipeline).to_list(12)
    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    result = []
    for m in monthly_data:
        month_idx = int(m['_id']) - 1
        result.append({
            "month": months[month_idx] if 0 <= month_idx < 12 else m['_id'],
            "month_num": m['_id'],
            "bookings": m['booking_count'],
            "revenue": m['total_revenue'],
            "guests": m['total_guests']
        })
    
    # Fill missing months
    existing_months = {r['month_num'] for r in result}
    for i, month in enumerate(months):
        month_num = f"{i+1:02d}"
        if month_num not in existing_months:
            result.append({"month": month, "month_num": month_num, "bookings": 0, "revenue": 0, "guests": 0})
    
    result.sort(key=lambda x: x['month_num'])
    
    # Identify peak season
    peak = max(result, key=lambda x: x['bookings']) if result else None
    
    return {
        "year": year,
        "monthly_data": result,
        "peak_month": peak['month'] if peak else None,
        "total_bookings": sum(r['bookings'] for r in result),
        "total_revenue": sum(r['revenue'] for r in result)
    }

@api_router.get("/analytics/idle-days")
async def get_idle_days(hall_id: str, start_date: str, end_date: str, current_user: dict = Depends(get_current_user)):
    # Get all booked dates for this hall
    bookings = await db.bookings.find({
        "hall_id": hall_id,
        "event_date": {"$gte": start_date, "$lte": end_date},
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0, "event_date": 1}).to_list(1000)
    
    booked_dates = set(b['event_date'] for b in bookings)
    
    # Generate all dates in range
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    idle_dates = []
    current = start
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        if date_str not in booked_dates:
            idle_dates.append(date_str)
        current += timedelta(days=1)
    
    hall = await db.halls.find_one({"id": hall_id}, {"_id": 0})
    
    return {
        "hall_id": hall_id,
        "hall_name": hall['name'] if hall else "Unknown",
        "period": {"start": start_date, "end": end_date},
        "total_idle_days": len(idle_dates),
        "idle_dates": idle_dates
    }

# ==================== FINANCIAL REPORTS (GST) ====================
@api_router.get("/reports/financial")
async def get_financial_report(start_date: str, end_date: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get bookings in date range
    bookings = await db.bookings.find({
        "event_date": {"$gte": start_date, "$lte": end_date},
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0}).to_list(1000)
    
    # Get expenses in date range
    expenses = await db.expenses.find({
        "date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(1000)
    
    # Calculate totals
    total_revenue = sum(b.get('total_amount', 0) for b in bookings)
    total_collected = sum(b.get('advance_paid', 0) for b in bookings)
    total_expenses = sum(e.get('amount', 0) for e in expenses)
    
    # GST calculations (18% = 9% CGST + 9% SGST)
    gst_rate = 18
    taxable_amount = total_revenue / 1.18  # Remove GST from total
    total_gst = total_revenue - taxable_amount
    cgst = total_gst / 2
    sgst = total_gst / 2
    
    # Group expenses by category
    expense_by_category = {}
    for exp in expenses:
        cat = exp.get('category', 'other')
        expense_by_category[cat] = expense_by_category.get(cat, 0) + exp.get('amount', 0)
    
    # Event-wise breakdown
    event_breakdown = []
    for booking in bookings:
        customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
        hall = await db.halls.find_one({"id": booking['hall_id']}, {"_id": 0})
        
        # Get expenses for this booking
        booking_expenses = sum(e.get('amount', 0) for e in expenses if e.get('booking_id') == booking['id'])
        
        event_breakdown.append({
            "booking_number": booking['booking_number'],
            "customer": customer['name'] if customer else 'Unknown',
            "hall": hall['name'] if hall else 'Unknown',
            "event_date": booking['event_date'],
            "event_type": booking['event_type'],
            "revenue": booking['total_amount'],
            "collected": booking['advance_paid'],
            "expenses": booking_expenses,
            "profit": booking['total_amount'] - booking_expenses
        })
    
    return {
        "period": {"start": start_date, "end": end_date},
        "revenue": {
            "total": round(total_revenue, 2),
            "collected": round(total_collected, 2),
            "pending": round(total_revenue - total_collected, 2)
        },
        "gst": {
            "rate": gst_rate,
            "taxable_amount": round(taxable_amount, 2),
            "cgst": round(cgst, 2),
            "sgst": round(sgst, 2),
            "total_gst": round(total_gst, 2)
        },
        "expenses": {
            "total": round(total_expenses, 2),
            "by_category": expense_by_category
        },
        "profit": {
            "gross": round(total_revenue - total_expenses, 2),
            "net": round(taxable_amount - total_expenses, 2)
        },
        "event_breakdown": event_breakdown,
        "summary": {
            "total_events": len(bookings),
            "avg_revenue_per_event": round(total_revenue / len(bookings), 2) if bookings else 0
        }
    }

@api_router.get("/reports/gst-summary")
async def get_gst_summary(year: int, month: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if month:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
    else:
        start_date = f"{year}-01-01"
        end_date = f"{year + 1}-01-01"
    
    bookings = await db.bookings.find({
        "event_date": {"$gte": start_date, "$lt": end_date},
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0}).to_list(5000)
    
    total_revenue = sum(b.get('total_amount', 0) for b in bookings)
    taxable_amount = total_revenue / 1.18
    total_gst = total_revenue - taxable_amount
    
    return {
        "period": {"year": year, "month": month},
        "invoice_count": len(bookings),
        "taxable_amount": round(taxable_amount, 2),
        "cgst_9": round(total_gst / 2, 2),
        "sgst_9": round(total_gst / 2, 2),
        "total_gst_collected": round(total_gst, 2),
        "total_with_gst": round(total_revenue, 2)
    }

# ==================== NOTIFICATION SYSTEM ====================
@api_router.get("/notifications/templates")
async def get_notification_templates(current_user: dict = Depends(get_current_user)):
    templates = await db.notification_templates.find({}, {"_id": 0}).to_list(100)
    if not templates:
        # Return default templates
        return [
            {"id": "t1", "notification_type": "booking_confirmation", "channel": "whatsapp", "template": "Dear {customer_name}, your booking #{booking_number} for {event_type} on {event_date} at {hall_name} is confirmed! Total: ₹{total_amount}", "is_active": True},
            {"id": "t2", "notification_type": "payment_reminder", "channel": "whatsapp", "template": "Reminder: ₹{balance_due} is pending for your event on {event_date}. Booking: #{booking_number}", "is_active": True},
            {"id": "t3", "notification_type": "event_reminder", "channel": "whatsapp", "template": "Your {event_type} at {hall_name} is tomorrow! We look forward to hosting you. - Mayur Simran Banquet", "is_active": True}
        ]
    return templates

@api_router.put("/notifications/templates/{template_id}")
async def update_notification_template(template_id: str, template: str, is_active: bool, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.notification_templates.update_one(
        {"id": template_id},
        {"$set": {"template": template, "is_active": is_active}},
        upsert=True
    )
    return {"message": "Template updated"}

@api_router.get("/notifications/logs")
async def get_notification_logs(booking_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if booking_id:
        query['booking_id'] = booking_id
    logs = await db.notification_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return logs

@api_router.post("/notifications/send")
async def send_notification(booking_id: str, notification_type: str, current_user: dict = Depends(get_current_user)):
    """Simulate sending a notification (would integrate with WhatsApp/SMS API)"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    customer = await db.customers.find_one({"id": booking['customer_id']}, {"_id": 0})
    hall = await db.halls.find_one({"id": booking['hall_id']}, {"_id": 0})
    
    # Build message from template
    message = f"[{notification_type.upper()}] Dear {customer['name'] if customer else 'Customer'}, "
    if notification_type == "booking_confirmation":
        message += f"your booking #{booking['booking_number']} for {booking['event_type']} on {booking['event_date']} at {hall['name'] if hall else 'venue'} is confirmed!"
    elif notification_type == "payment_reminder":
        message += f"reminder: ₹{booking['balance_due']:,.0f} is pending for your event on {booking['event_date']}."
    elif notification_type == "event_reminder":
        message += f"your {booking['event_type']} at {hall['name'] if hall else 'venue'} is tomorrow! We look forward to hosting you."
    
    # Log the notification (in real implementation, this would call WhatsApp/SMS API)
    log = NotificationLog(
        booking_id=booking_id,
        notification_type=NotificationType(notification_type),
        channel="whatsapp",
        recipient=customer['phone'] if customer else '',
        message=message,
        status="sent"
    )
    log_doc = log.model_dump()
    log_doc['created_at'] = log_doc['created_at'].isoformat()
    await db.notification_logs.insert_one(log_doc)
    
    return {"message": "Notification sent", "log_id": log.id}

# ==================== SUPER ADMIN ROUTES ====================
# Stats
@api_router.get("/superadmin/stats")
async def get_superadmin_stats(current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    total_tenants = await db.tenants.count_documents({})
    active_tenants = await db.tenants.count_documents({"status": "active"})
    total_users = await db.users.count_documents({"role": {"$ne": "super_admin"}})
    total_plans = await db.plans.count_documents({})
    
    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_users": total_users,
        "total_plans": total_plans
    }

# Plans CRUD
@api_router.get("/superadmin/plans")
async def get_plans(current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    plans = await db.plans.find({}, {"_id": 0}).to_list(100)
    # Add tenant count to each plan
    for plan in plans:
        plan['tenant_count'] = await db.tenants.count_documents({"plan_id": plan['id']})
    return plans

@api_router.get("/superadmin/plans/{plan_id}")
async def get_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@api_router.post("/superadmin/plans")
async def create_plan(plan_data: PlanCreate, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    plan = Plan(**plan_data.model_dump())
    plan_doc = plan.model_dump()
    plan_doc['created_at'] = plan_doc['created_at'].isoformat()
    await db.plans.insert_one(plan_doc)
    plan_doc.pop('_id', None)
    return plan_doc

@api_router.put("/superadmin/plans/{plan_id}")
async def update_plan(plan_id: str, plan_data: PlanCreate, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    result = await db.plans.update_one(
        {"id": plan_id},
        {"$set": plan_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    return plan

@api_router.delete("/superadmin/plans/{plan_id}")
async def delete_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    # Check if any tenants are using this plan
    tenant_count = await db.tenants.count_documents({"plan_id": plan_id})
    if tenant_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete plan with {tenant_count} tenant(s) using it")
    
    result = await db.plans.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan deleted"}

# Tenants CRUD
@api_router.get("/superadmin/tenants")
async def get_tenants(current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(500)
    # Add user count to each tenant
    for tenant in tenants:
        tenant['user_count'] = await db.users.count_documents({"tenant_id": tenant['id']})
    return tenants

@api_router.get("/superadmin/tenants/{tenant_id}")
async def get_tenant(tenant_id: str, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant['user_count'] = await db.users.count_documents({"tenant_id": tenant_id})
    return tenant

@api_router.post("/superadmin/tenants")
async def create_tenant(tenant_data: TenantCreate, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    tenant = Tenant(**tenant_data.model_dump())
    tenant_doc = tenant.model_dump()
    tenant_doc['created_at'] = tenant_doc['created_at'].isoformat()
    await db.tenants.insert_one(tenant_doc)
    tenant_doc.pop('_id', None)
    return tenant_doc

@api_router.put("/superadmin/tenants/{tenant_id}")
async def update_tenant(tenant_id: str, tenant_data: TenantUpdate, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    update_dict = {k: v for k, v in tenant_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.tenants.update_one({"id": tenant_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    return tenant

@api_router.delete("/superadmin/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    # Delete all users in tenant
    await db.users.delete_many({"tenant_id": tenant_id})
    
    # Delete tenant
    result = await db.tenants.delete_one({"id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Tenant and all associated users deleted"}

# Tenant Users Management
@api_router.get("/superadmin/tenants/{tenant_id}/users")
async def get_tenant_users(tenant_id: str, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    # Verify tenant exists
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    users = await db.users.find({"tenant_id": tenant_id}, {"_id": 0, "password": 0}).to_list(500)
    return users

class TenantUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str = ""
    role: str = "reception"

class TenantUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

@api_router.post("/superadmin/tenants/{tenant_id}/users")
async def create_tenant_user(tenant_id: str, user_data: TenantUserCreate, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    # Verify tenant exists
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "role": user_data.role,
        "tenant_id": tenant_id,
        "status": "active",
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    user_doc.pop('_id', None)
    user_doc.pop('password', None)
    return user_doc

@api_router.put("/superadmin/tenants/{tenant_id}/users/{user_id}")
async def update_tenant_user(tenant_id: str, user_id: str, user_data: TenantUserUpdate, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    # Verify user exists and belongs to tenant
    user = await db.users.find_one({"id": user_id, "tenant_id": tenant_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this tenant")
    
    update_dict = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    # Hash password if provided
    if 'password' in update_dict and update_dict['password']:
        update_dict['password'] = hash_password(update_dict['password'])
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data to update")
    
    await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return updated_user

@api_router.delete("/superadmin/tenants/{tenant_id}/users/{user_id}")
async def delete_tenant_user(tenant_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    require_super_admin(current_user)
    
    # Verify user exists and belongs to tenant
    user = await db.users.find_one({"id": user_id, "tenant_id": tenant_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this tenant")
    
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted"}

# ==================== AUDIT LOGS ROUTES ====================
@api_router.get("/audit-logs")
async def get_audit_logs(
    entity_type: str = None,
    entity_id: str = None,
    action: str = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get audit logs for tenant"""
    require_permission(current_user, "audit:read")
    
    query = await get_tenant_filter(current_user)
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if action:
        query["action"] = action
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs

# ==================== CSV EXPORT ROUTES ====================
@api_router.get("/export/bookings")
async def export_bookings_csv(
    status: str = None,
    start_date: str = None,
    end_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Export bookings as CSV"""
    require_permission(current_user, "reports:read")
    
    query = await get_tenant_filter(current_user)
    query["is_deleted"] = {"$ne": True}
    
    if status:
        query["status"] = status
    if start_date:
        query["event_date"] = {"$gte": start_date}
    if end_date:
        if "event_date" in query:
            query["event_date"]["$lte"] = end_date
        else:
            query["event_date"] = {"$lte": end_date}
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(5000)
    
    # Build CSV
    import io
    import csv
    
    output = io.StringIO()
    if bookings:
        writer = csv.DictWriter(output, fieldnames=[
            "booking_number", "event_date", "slot", "guest_count", "status",
            "total_amount", "paid_amount", "created_at"
        ])
        writer.writeheader()
        for b in bookings:
            writer.writerow({
                "booking_number": b.get("booking_number", ""),
                "event_date": b.get("event_date", ""),
                "slot": b.get("slot", ""),
                "guest_count": b.get("guest_count", 0),
                "status": b.get("status", ""),
                "total_amount": b.get("total_amount", 0),
                "paid_amount": b.get("paid_amount", 0),
                "created_at": b.get("created_at", "")
            })
    
    from fastapi.responses import StreamingResponse
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bookings_export.csv"}
    )

@api_router.get("/export/customers")
async def export_customers_csv(current_user: dict = Depends(get_current_user)):
    """Export customers as CSV"""
    require_permission(current_user, "reports:read")
    
    query = await get_tenant_filter(current_user)
    query["is_deleted"] = {"$ne": True}
    
    customers = await db.customers.find(query, {"_id": 0}).to_list(5000)
    
    import io
    import csv
    
    output = io.StringIO()
    if customers:
        writer = csv.DictWriter(output, fieldnames=["name", "email", "phone", "address", "created_at"])
        writer.writeheader()
        for c in customers:
            writer.writerow({
                "name": c.get("name", ""),
                "email": c.get("email", ""),
                "phone": c.get("phone", ""),
                "address": c.get("address", ""),
                "created_at": c.get("created_at", "")
            })
    
    from fastapi.responses import StreamingResponse
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers_export.csv"}
    )

@api_router.get("/export/payments")
async def export_payments_csv(
    start_date: str = None,
    end_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Export payments as CSV"""
    require_permission(current_user, "reports:read")
    
    query = await get_tenant_filter(current_user)
    
    if start_date:
        query["payment_date"] = {"$gte": start_date}
    if end_date:
        if "payment_date" in query:
            query["payment_date"]["$lte"] = end_date
        else:
            query["payment_date"] = {"$lte": end_date}
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(5000)
    
    import io
    import csv
    
    output = io.StringIO()
    if payments:
        writer = csv.DictWriter(output, fieldnames=[
            "booking_id", "amount", "payment_mode", "payment_date", "notes"
        ])
        writer.writeheader()
        for p in payments:
            writer.writerow({
                "booking_id": p.get("booking_id", ""),
                "amount": p.get("amount", 0),
                "payment_mode": p.get("payment_mode", ""),
                "payment_date": p.get("payment_date", ""),
                "notes": p.get("notes", "")
            })
    
    from fastapi.responses import StreamingResponse
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payments_export.csv"}
    )

# ==================== SOFT DELETE / RESTORE ROUTES ====================
@api_router.post("/bookings/{booking_id}/restore")
async def restore_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Restore a soft-deleted booking"""
    require_permission(current_user, "bookings:delete")
    
    tenant_filter = await get_tenant_filter(current_user)
    query = {"id": booking_id, **tenant_filter}
    
    booking = await db.bookings.find_one(query, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not booking.get("is_deleted"):
        return {"message": "Booking is not deleted"}
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"is_deleted": False, "deleted_at": None}}
    )
    
    # Audit log
    await create_audit_log(
        tenant_id=current_user.get('tenant_id'),
        user_id=current_user.get('user_id'),
        user_email=current_user.get('email'),
        action="restore",
        entity_type="booking",
        entity_id=booking_id
    )
    
    return {"message": "Booking restored successfully"}

@api_router.get("/bookings/deleted")
async def get_deleted_bookings(current_user: dict = Depends(get_current_user)):
    """Get soft-deleted bookings"""
    require_permission(current_user, "bookings:read")
    
    tenant_filter = await get_tenant_filter(current_user)
    query = {**tenant_filter, "is_deleted": True}
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(500)
    return bookings

# ==================== DATA MIGRATION ENDPOINT ====================
@api_router.post("/superadmin/migrate-data")
async def migrate_existing_data(current_user: dict = Depends(get_current_user)):
    """Migrate existing data to the first active tenant"""
    require_super_admin(current_user)
    
    # Find first active tenant
    tenant = await db.tenants.find_one({"status": "active"}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=400, detail="No active tenant found")
    
    tenant_id = tenant['id']
    
    # Migrate all data without tenant_id to this tenant
    collections_to_migrate = ['bookings', 'halls', 'menu_items', 'customers', 'vendors', 'payments', 'expenses', 'party_expenses']
    
    results = {}
    for collection in collections_to_migrate:
        result = await db[collection].update_many(
            {"tenant_id": {"$exists": False}},
            {"$set": {"tenant_id": tenant_id}}
        )
        results[collection] = result.modified_count
        
        # Also migrate where tenant_id is null
        result2 = await db[collection].update_many(
            {"tenant_id": None},
            {"$set": {"tenant_id": tenant_id}}
        )
        results[collection] += result2.modified_count
    
    # Migrate users (except super_admin)
    user_result = await db.users.update_many(
        {"tenant_id": {"$exists": False}, "role": {"$ne": "super_admin"}},
        {"$set": {"tenant_id": tenant_id}}
    )
    results['users'] = user_result.modified_count
    
    user_result2 = await db.users.update_many(
        {"tenant_id": None, "role": {"$ne": "super_admin"}},
        {"$set": {"tenant_id": tenant_id}}
    )
    results['users'] += user_result2.modified_count
    
    return {
        "message": f"Data migrated to tenant '{tenant['business_name']}'",
        "tenant_id": tenant_id,
        "migrated_records": results
    }

# ==================== SEED DATA ====================
@api_router.post("/seed")
async def seed_data():
    """Seed initial data for testing - now with multi-tenant support"""
    # Check if already seeded
    existing = await db.tenants.find_one({}, {"_id": 0})
    if existing:
        return {"message": "Data already seeded"}
    
    # === PHASE H: Create Plans ===
    basic_plan_id = str(uuid.uuid4())
    pro_plan_id = str(uuid.uuid4())
    enterprise_plan_id = str(uuid.uuid4())
    
    plans_data = [
        {
            "id": basic_plan_id,
            "name": "Basic",
            "description": "Essential features for small banquets",
            "features": {
                "bookings": True, "calendar": True, "halls": True, "menu": True,
                "customers": True, "payments": True, "enquiries": True,
                "reports": False, "vendors": False, "analytics": False,
                "notifications": False, "expenses": False, "party_planning": False
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": pro_plan_id,
            "name": "Pro",
            "description": "Advanced features for growing businesses",
            "features": {
                "bookings": True, "calendar": True, "halls": True, "menu": True,
                "customers": True, "payments": True, "enquiries": True,
                "reports": True, "vendors": True, "analytics": True,
                "notifications": False, "expenses": True, "party_planning": False
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": enterprise_plan_id,
            "name": "Enterprise",
            "description": "All features for large operations",
            "features": {
                "bookings": True, "calendar": True, "halls": True, "menu": True,
                "customers": True, "payments": True, "enquiries": True,
                "reports": True, "vendors": True, "analytics": True,
                "notifications": True, "expenses": True, "party_planning": True
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for plan in plans_data:
        await db.plans.insert_one(plan)
    
    # === Create Super Admin ===
    super_admin_id = str(uuid.uuid4())
    super_admin_doc = {
        "id": super_admin_id,
        "name": "Super Admin",
        "email": "superadmin@banquetos.com",
        "phone": "9999999999",
        "role": "super_admin",
        "tenant_id": None,
        "status": "active",
        "password": hash_password("superadmin123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(super_admin_doc)
    
    # === Create Demo Tenant: Tamasha Banquet ===
    tenant_id = str(uuid.uuid4())
    tenant_doc = {
        "id": tenant_id,
        "business_name": "Tamasha Banquet",
        "country": "India",
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "status": "active",
        "plan_id": enterprise_plan_id,
        "features_override": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenants.insert_one(tenant_doc)
    
    # === Migrate existing users to tenant ===
    # Create admin user for Tamasha Banquet
    admin_id = str(uuid.uuid4())
    admin_doc = {
        "id": admin_id,
        "name": "Admin",
        "email": "admin@mayurbanquet.com",
        "phone": "9876543210",
        "role": "tenant_admin",
        "tenant_id": tenant_id,
        "status": "active",
        "password": hash_password("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_doc)
    
    # Create reception user for Tamasha Banquet
    reception_id = str(uuid.uuid4())
    reception_doc = {
        "id": reception_id,
        "name": "Reception",
        "email": "reception@mayurbanquet.com",
        "phone": "9876543212",
        "role": "reception",
        "tenant_id": tenant_id,
        "status": "active",
        "password": hash_password("reception123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(reception_doc)
    
    # === Create halls with tenant_id ===
    halls_data = [
        {"name": "Mayur Grand Hall", "capacity": 500, "price_per_day": 0, "description": "Our flagship hall perfect for grand weddings and large celebrations", "amenities": ["AC", "Stage", "Parking", "Kitchen", "Decoration Area"], "images": ["https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=800"], "tenant_id": tenant_id},
        {"name": "Simran Banquet", "capacity": 300, "price_per_day": 0, "description": "Elegant hall ideal for medium-sized events and receptions", "amenities": ["AC", "Stage", "Parking", "Sound System"], "images": ["https://images.unsplash.com/photo-1568989357443-057c03fb10fc?w=800"], "tenant_id": tenant_id},
        {"name": "Royal Suite", "capacity": 100, "price_per_day": 0, "description": "Intimate venue for small gatherings and corporate events", "amenities": ["AC", "Projector", "Wi-Fi", "Parking"], "images": ["https://images.unsplash.com/photo-1736155983520-a0f7d5949d39?w=800"], "tenant_id": tenant_id}
    ]
    
    for hall_data in halls_data:
        hall = Hall(**hall_data)
        hall_doc = hall.model_dump()
        hall_doc['created_at'] = hall_doc['created_at'].isoformat()
        await db.halls.insert_one(hall_doc)
    
    # Create menu items
    menu_data = [
        {"name": "Paneer Butter Masala", "category": "Main Course", "menu_type": "veg", "price_per_plate": 150},
        {"name": "Dal Makhani", "category": "Main Course", "menu_type": "veg", "price_per_plate": 100},
        {"name": "Mix Veg", "category": "Main Course", "menu_type": "veg", "price_per_plate": 80},
        {"name": "Jeera Rice", "category": "Rice", "menu_type": "veg", "price_per_plate": 60},
        {"name": "Butter Naan", "category": "Breads", "menu_type": "veg", "price_per_plate": 30},
        {"name": "Chicken Curry", "category": "Main Course", "menu_type": "non_veg", "price_per_plate": 200},
        {"name": "Mutton Rogan Josh", "category": "Main Course", "menu_type": "non_veg", "price_per_plate": 300},
        {"name": "Fish Fry", "category": "Starters", "menu_type": "non_veg", "price_per_plate": 250},
        {"name": "Gulab Jamun", "category": "Desserts", "menu_type": "veg", "price_per_plate": 50},
        {"name": "Ice Cream", "category": "Desserts", "menu_type": "veg", "price_per_plate": 40},
        {"name": "Live Chaat Counter", "category": "Add-on", "menu_type": "veg", "price_per_plate": 15000, "is_addon": True},
        {"name": "DJ Setup", "category": "Add-on", "menu_type": "veg", "price_per_plate": 25000, "is_addon": True},
        {"name": "Flower Decoration", "category": "Add-on", "menu_type": "veg", "price_per_plate": 30000, "is_addon": True},
        {"name": "Photography Package", "category": "Add-on", "menu_type": "veg", "price_per_plate": 50000, "is_addon": True}
    ]
    
    for item_data in menu_data:
        item_data['tenant_id'] = tenant_id
        item = MenuItem(**item_data)
        item_doc = item.model_dump()
        item_doc['tenant_id'] = tenant_id
        item_doc['created_at'] = item_doc['created_at'].isoformat()
        await db.menu_items.insert_one(item_doc)
    
    # Create sample customer with tenant_id
    customer = Customer(name="Rajesh Kumar", email="rajesh@email.com", phone="9876543211", address="Rajpura, Punjab")
    customer_doc = customer.model_dump()
    customer_doc['tenant_id'] = tenant_id
    customer_doc['created_at'] = customer_doc['created_at'].isoformat()
    await db.customers.insert_one(customer_doc)
    
    # Create sample vendors with tenant_id
    vendors_data = [
        {"name": "Sharma Decorators", "vendor_type": "decor", "phone": "9876500001", "email": "sharma.decor@email.com", "services": ["Stage Setup", "Flower Arrangements", "LED Walls"], "base_rate": 50000},
        {"name": "DJ Sunny", "vendor_type": "dj_sound", "phone": "9876500002", "email": "djsunny@email.com", "services": ["DJ", "Sound System", "Lighting"], "base_rate": 25000},
        {"name": "Patiala Flowers", "vendor_type": "flower", "phone": "9876500003", "email": "patialaflowers@email.com", "services": ["Mandap Flowers", "Car Decoration", "Entry Gate"], "base_rate": 30000},
        {"name": "Verma Photography", "vendor_type": "photography", "phone": "9876500004", "email": "vermaphoto@email.com", "services": ["Photography", "Videography", "Drone Shots", "Album"], "base_rate": 75000},
        {"name": "Royal Caterers", "vendor_type": "catering", "phone": "9876500005", "email": "royalcaterers@email.com", "services": ["Live Counters", "Punjabi Cuisine", "Chinese"], "base_rate": 100000}
    ]
    
    for vendor_data in vendors_data:
        vendor = Vendor(**vendor_data)
        vendor_doc = vendor.model_dump()
        vendor_doc['tenant_id'] = tenant_id
        vendor_doc['created_at'] = vendor_doc['created_at'].isoformat()
        await db.vendors.insert_one(vendor_doc)
    
    # Create indexes for tenant_id
    await db.halls.create_index("tenant_id")
    await db.menu_items.create_index("tenant_id")
    await db.customers.create_index("tenant_id")
    await db.vendors.create_index("tenant_id")
    await db.bookings.create_index("tenant_id")
    await db.users.create_index("tenant_id")
    await db.payments.create_index("tenant_id")
    await db.expenses.create_index("tenant_id")
    
    return {
        "message": "Multi-tenant data seeded successfully", 
        "credentials": {
            "super_admin": {"email": "superadmin@banquetos.com", "password": "superadmin123"},
            "admin": {"email": "admin@mayurbanquet.com", "password": "admin123"},
            "reception": {"email": "reception@mayurbanquet.com", "password": "reception123"}
        },
        "tenant": {
            "name": "Tamasha Banquet",
            "id": tenant_id
        }
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
