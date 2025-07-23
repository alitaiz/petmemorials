# Pet Memorials

This project is a small proof‑of‑concept service that lets users create short memorial pages by scanning a QR code. It consists of a small Flask back‑end and a simple React front‑end.

## Running locally

1. Install Python dependencies:

```bash
pip install -r requirement.txt
```

2. Start the development server:

```bash
python main.py
```

The app will run on `http://localhost:8001`. Opening `/start` loads the main page.

## Features

- Create a memorial page with an optional short code
- Upload images and videos (limits depend on plan)
- Pages are associated with a device ID stored in `localStorage`
- Returning users are redirected to their page if only one exists

This repository only provides basic UI styling and mock premium subscription logic. It is meant as a minimal demonstration rather than a production ready service.
