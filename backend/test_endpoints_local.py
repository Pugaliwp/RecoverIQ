import requests
import json

base_url = "http://127.0.0.1:8002"
opp_ids = ["OPP_1", "OPP_2", "OPP_3"]

print('=== 1. Testing /health ===')
try:
    health = requests.get(f'{base_url}/health')
    print('Status:', health.status_code, health.json())
except Exception as e:
    print('Failed to reach /health:', e)

print('\n=== 2. Testing /api/recovery/analyze/{opportunity_id} on synthetic opportunities ===')
for opp_id in opp_ids:
    print(f'\nOpportunity: {opp_id}')
    try:
        res = requests.post(f'{base_url}/api/recovery/analyze/{opp_id}')
        if res.status_code == 200:
            data = res.json()
            print(f"Probability: {data.get('recovery_probability')}")
            print(f"Risk Band: {data.get('risk_band')}")
            print(f"Recommended Action: {data.get('recommended_action')}")
            print(f"Confidence: {data.get('confidence')}")
            print(f"Explanation: {json.dumps(data.get('explanation'), indent=2)}")
        else:
            print('Error:', res.status_code, res.text)
    except Exception as e:
        print('Failed to reach local server:', e)
