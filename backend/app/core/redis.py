import redis
import logging
from app.core.config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    decode_responses=True
)

try:
    redis_client.ping()
    logging.info("Redis conectado com sucesso no backend.")
except Exception as e:
    logging.error(f"Erro ao conectar no Redis: {e}")

# Filas
IG_COMMENTS_QUEUE = "ig_comments"
IG_DMS_QUEUE = "ig_dms"
MESSENGER_DMS_QUEUE = "messenger_dms"
