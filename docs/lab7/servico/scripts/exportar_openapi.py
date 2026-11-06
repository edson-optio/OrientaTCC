"""Gera docs/openapi.json a partir da aplicação FastAPI."""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from app.main import criar_app  # noqa: E402

destino = pathlib.Path(__file__).resolve().parents[1] / "docs" / "openapi.json"
destino.write_text(json.dumps(criar_app().openapi(), ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OpenAPI exportado para {destino}")
