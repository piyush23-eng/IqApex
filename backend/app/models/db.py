from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String

from app.database.session import Base


class SessionModel(Base):
    __tablename__ = "sessions"

    session_id = Column(String(64), primary_key=True, index=True)
    event_name = Column(String(128), nullable=False)
    circuit = Column(String(128), nullable=False)
    session_type = Column(String(32), nullable=False)
    date = Column(String(32), nullable=False)
    weather = Column(String(128), nullable=False)
    track_temperature = Column(Float, nullable=False)


class DriverModel(Base):
    __tablename__ = "drivers"

    driver_id = Column(String(32), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    team = Column(String(128), nullable=False)
    car_number = Column(Integer, nullable=False)


class RunModel(Base):
    __tablename__ = "runs"

    run_id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("sessions.session_id"), nullable=False)
    driver_id = Column(String(32), ForeignKey("drivers.driver_id"), nullable=False)
    compound = Column(String(32), nullable=False)
    tyre_age = Column(Integer, nullable=False)
    run_type = Column(String(64), nullable=False)
    start_time = Column(String(64), nullable=False)
    end_time = Column(String(64), nullable=False)


class LapModel(Base):
    __tablename__ = "laps"

    lap_id = Column(String(64), primary_key=True, index=True)
    run_id = Column(String(64), ForeignKey("runs.run_id"), nullable=False)
    lap_number = Column(Integer, nullable=False)
    lap_time = Column(Float, nullable=False)
    sector_1 = Column(Float, nullable=False)
    sector_2 = Column(Float, nullable=False)
    sector_3 = Column(Float, nullable=False)
    valid = Column(Boolean, default=True, nullable=False)
