from flask import Blueprint, jsonify, request
from .database import get_all_shipments, add_shipment_to_db, update_shipment_status, clear_db

api_bp = Blueprint('api', __name__)

@api_bp.route('/shipments', methods=['GET'])
def get_shipments():
    return jsonify(get_all_shipments())

@api_bp.route('/shipments', methods=['POST'])
def add_shipment():
    data = request.json
    required_fields = ['trackingId', 'destination', 'priority', 'status']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        new_id = add_shipment_to_db(data)
        return jsonify({"message": "Shipment added successfully", "id": new_id}), 201
    except Exception as e:
        return jsonify({"error": f"Database insertion failed: {str(e)}"}), 500

@api_bp.route('/shipments/<id>', methods=['PUT'])
def update_shipment(id):
    data = request.json
    new_status = data.get('status')
    if not new_status:
        return jsonify({"error": "Missing 'status' field"}), 400

    if update_shipment_status(id, new_status):
        return jsonify({"message": f"Shipment {id} status updated to {new_status}"}), 200
    else:
        return jsonify({"error": "Shipment not found"}), 404

@api_bp.route('/shipments/clear', methods=['DELETE'])
def clear_all_shipments():
    try:
        clear_db()
        return jsonify({"message": "All shipments cleared and demo data reloaded."}), 200
    except Exception as e:
        return jsonify({"error": f"Database clear failed: {str(e)}"}), 500
