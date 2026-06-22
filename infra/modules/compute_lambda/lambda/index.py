import json
import urllib.request
import os

def lambda_handler(event, context):
    url = os.environ["HEALTH_URL"]

    try:
        response = urllib.request.urlopen(url, timeout=10)

        print(f"Response: {response.status}")

        return {
            "statusCode": response.status,
            "body": response.read().decode()
        }

    except Exception as ex:
        print(f"Error: {str(ex)}")
        return {
            "statusCode": 500,
            "body": str(ex)
        }