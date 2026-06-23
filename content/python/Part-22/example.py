import json

config = {
    "db_host": "localhost",
    "db_port": 5432,
    "debug": True,
    "allowed_origins": ["http://localhost:3000"]
}

with open("config.json", "w") as f:
    json.dump(config, f, indent=2)