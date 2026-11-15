from decimal import Decimal
from unittest.mock import AsyncMock
from uuid import uuid4

from app.schemas.impact import ImpactAggregateItem
from app.schemas.investigation import BlastRadiusResult
from app.services import investigation_service


def test_blast_radius_keeps_estimated_and_verified_separate(auth_client, monkeypatch):
    event_id = uuid4()
    result = BlastRadiusResult(
        start_event_id=event_id,
        link_mode="confirmed_only",
        uniqueness_note="unique",
        nodes=[],
        impacts=[
            ImpactAggregateItem(
                affected_object_key="activity:1",
                impact_type_code="students_affected",
                impact_type_name="Students Affected",
                unit_code="person",
                unit_name="Person",
                verification_status="verified",
                headline_quantity=Decimal("45"),
                impact_record_count=1,
                impact_ids=[uuid4()],
                possible_duplicate_impact_ids=[],
                aggregation_note="Single structured impact record",
            ),
            ImpactAggregateItem(
                affected_object_key="service:1",
                impact_type_code="downtime",
                impact_type_name="Downtime",
                unit_code="hour",
                unit_name="Hour",
                verification_status="estimated",
                headline_quantity=Decimal("2.500"),
                impact_record_count=1,
                impact_ids=[uuid4()],
                possible_duplicate_impact_ids=[],
                aggregation_note="Single structured impact record",
            ),
        ],
        impact_grouping_note="units remain separate",
    )
    monkeypatch.setattr(investigation_service, "blast_radius", AsyncMock(return_value=result))
    response = auth_client.get(f"/api/v1/events/{event_id}/blast-radius")
    assert response.status_code == 200
    statuses = {(item["impact_type_code"], item["unit_code"], item["verification_status"]) for item in response.json()["impacts"]}
    assert ("students_affected", "person", "verified") in statuses
    assert ("downtime", "hour", "estimated") in statuses


def test_add_impact_with_department_and_measurement_units_reference(auth_client, monkeypatch):
    from datetime import datetime, timezone
    from app.api.v1 import reference as reference_router
    from app.schemas.impact import ImpactRead
    from app.services import impact_service

    monkeypatch.setattr(
        reference_router,
        "lookup",
        AsyncMock(
            return_value=[
                {"code": "INR", "display_name": "Indian Rupee", "symbol": "INR", "dimension_code": "currency_inr", "decimal_places": 2, "is_active": True},
                {"code": "hour", "display_name": "Hour", "symbol": "h", "dimension_code": "time", "decimal_places": 2, "is_active": True},
                {"code": "item", "display_name": "Item", "symbol": "item", "dimension_code": "count_items", "decimal_places": 0, "is_active": True},
                {"code": "minute", "display_name": "Minute", "symbol": "min", "dimension_code": "time", "decimal_places": 0, "is_active": True},
                {"code": "person", "display_name": "Person", "symbol": "person", "dimension_code": "count_people", "decimal_places": 0, "is_active": True},
                {"code": "session", "display_name": "Session", "symbol": "session", "dimension_code": "count_sessions", "decimal_places": 0, "is_active": True},
            ]
        ),
    )

    units_res = auth_client.get("/api/v1/reference/measurement_units")
    assert units_res.status_code == 200
    assert [u["code"] for u in units_res.json()] == ["INR", "hour", "item", "minute", "person", "session"]

    bad_units_res = auth_client.get("/api/v1/reference/units")
    assert bad_units_res.status_code == 404

    event_id = uuid4()
    dept_id = uuid4()
    created = ImpactRead(
        impact_id=uuid4(),
        event_id=event_id,
        impact_type_code="downtime",
        impact_type_name="Downtime",
        affected_location_id=None,
        affected_asset_id=None,
        affected_service_id=None,
        affected_activity_id=None,
        affected_department_id=dept_id,
        affected_object_description=None,
        quantity=Decimal("2"),
        unit_code="hour",
        unit_name="Hour",
        verification_status="estimated",
        estimate_basis="Illustrative two-hour campus power interruption",
        recorded_by=uuid4(),
        recorded_at=datetime(2026, 11, 10, 12, 0, tzinfo=timezone.utc),
        data_class_code="synthetic",
    )

    captured = {}

    async def fake_add_impact(user, ev_id, payload):
        captured["event_id"] = ev_id
        captured["payload"] = payload.model_dump()
        return created

    monkeypatch.setattr(impact_service, "add_impact", fake_add_impact)

    payload = {
        "impact_type_code": "downtime",
        "affected_location_id": None,
        "affected_asset_id": None,
        "affected_service_id": None,
        "affected_activity_id": None,
        "affected_department_id": str(dept_id),
        "affected_object_description": None,
        "quantity": 2,
        "unit_code": "hour",
        "verification_status": "estimated",
        "estimate_basis": "Illustrative two-hour campus power interruption",
        "data_class_code": "synthetic",
    }
    res = auth_client.post(f"/api/v1/events/{event_id}/impacts", json=payload)
    assert res.status_code == 201
    assert captured["event_id"] == event_id
    assert captured["payload"]["affected_department_id"] == dept_id
    assert captured["payload"]["data_class_code"] == "synthetic"
    assert res.json()["unit_code"] == "hour"
    assert res.json()["verification_status"] == "estimated"

