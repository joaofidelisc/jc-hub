import httpx
from app.core.config import settings

class EvolutionAPIClient:
    def __init__(self):
        self.base_url = settings.EVOLUTION_API_URL
        self.api_key = settings.EVOLUTION_API_KEY
        self.instance_name = settings.EVOLUTION_API_INSTANCE
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }

    async def create_instance(self):
        url = f"{self.base_url}/instance/create"
        payload = {
            "instanceName": self.instance_name,
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            return response.json()

    async def get_connection_state(self):
        url = f"{self.base_url}/instance/connectionState/{self.instance_name}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 404:
                return {"instance": {"state": "not_created"}}
            return response.json()
            
    async def send_text_message(self, number: str, text: str):
        url = f"{self.base_url}/message/sendText/{self.instance_name}"
        payload = {
            "number": number,
            "options": {
                "delay": 1200,
                "presence": "composing"
            },
            "textMessage": {
                "text": text
            }
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            return response.json()

evolution_client = EvolutionAPIClient()
