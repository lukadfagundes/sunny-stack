"""
Navigator's Helm Database Models
Equipment monitoring and intelligence data structures
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Equipment(Base):
    __tablename__ = "navigator_equipment"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    type = Column(String(100), nullable=False)
    status = Column(String(50), default="operational")
    location = Column(String(200))
    manufacturer = Column(String(100))
    model = Column(String(100))
    serial_number = Column(String(100), unique=True)
    installation_date = Column(DateTime)
    last_maintenance = Column(DateTime)
    next_maintenance = Column(DateTime)
    metrics = Column(JSON, default={})
    configuration = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    evaluations = relationship("EquipmentEvaluation", back_populates="equipment")
    events = relationship("EquipmentEvent", back_populates="equipment")
    metrics_history = relationship("MetricsHistory", back_populates="equipment")

class EquipmentEvaluation(Base):
    __tablename__ = "navigator_evaluations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(String(50), ForeignKey("navigator_equipment.id"))
    evaluation_type = Column(String(50), nullable=False)
    assistant = Column(String(50), nullable=False)  # navigator_helm, stilltide, tempest, firebird
    analysis = Column(Text)
    confidence = Column(Float)
    recommendations = Column(JSON, default=[])
    parameters = Column(JSON, default={})
    status = Column(String(50), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    equipment = relationship("Equipment", back_populates="evaluations")

class EquipmentEvent(Base):
    __tablename__ = "navigator_events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(String(50), ForeignKey("navigator_equipment.id"))
    event_type = Column(String(50), nullable=False)
    event_description = Column(Text)
    severity = Column(String(20), default="info")  # info, warning, error, critical
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolved_by = Column(String(100))
    metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    equipment = relationship("Equipment", back_populates="events")

class MetricsHistory(Base):
    __tablename__ = "navigator_metrics_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(String(50), ForeignKey("navigator_equipment.id"))
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float)
    unit = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    equipment = relationship("Equipment", back_populates="metrics_history")

class AssistantConfiguration(Base):
    __tablename__ = "navigator_assistant_config"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    assistant_name = Column(String(50), unique=True, nullable=False)
    role = Column(String(100))
    description = Column(Text)
    configuration = Column(JSON, default={})
    active = Column(Boolean, default=True)
    capabilities = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MaintenanceSchedule(Base):
    __tablename__ = "navigator_maintenance"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(String(50), ForeignKey("navigator_equipment.id"))
    maintenance_type = Column(String(100), nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    completed = Column(Boolean, default=False)
    completed_date = Column(DateTime)
    performed_by = Column(String(100))
    notes = Column(Text)
    cost = Column(Float)
    duration_hours = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PredictiveAnalysis(Base):
    __tablename__ = "navigator_predictions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(String(50), ForeignKey("navigator_equipment.id"))
    prediction_type = Column(String(100), nullable=False)
    prediction = Column(Text)
    probability = Column(Float)
    timeframe_days = Column(Integer)
    recommended_action = Column(Text)
    created_by = Column(String(50), default="tempest")  # Usually Tempest assistant
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

class SafetyAlert(Base):
    __tablename__ = "navigator_safety_alerts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(String(50), ForeignKey("navigator_equipment.id"))
    alert_level = Column(String(20), nullable=False)  # low, medium, high, critical
    alert_type = Column(String(100), nullable=False)
    description = Column(Text)
    action_required = Column(Text)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(100))
    acknowledged_at = Column(DateTime)
    resolved = Column(Boolean, default=False)
    resolved_by = Column(String(100))
    resolved_at = Column(DateTime)
    created_by = Column(String(50), default="firebird")  # Usually Firebird assistant
    created_at = Column(DateTime, default=datetime.utcnow)