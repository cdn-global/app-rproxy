#!/bin/bash
source .venv/bin/activate
export PROJECT_NAME="Roaming Proxy"
export ENVIRONMENT=production
export DOMAIN=ROAMINGPROXY.com
export STACK_NAME=roamingproxycom
export FRONTEND_HOST=https://cloud.roamingproxy.com
export BACKEND_CORS_ORIGINS=https://roamingproxy.com,https://www.roamingproxy.com
export STRIPE_SECRET_KEY=sk_test_51QvIuVQ2l5YXykhG7wHdQfBmPViPlgzEBHLjJjlzmCPJzuDNLJW2DqOjtrsNpOQwcxodqr2HuvLv9Zrw2UsKGsSy00V08xLKDK
export SECRET_KEY=2a4f9b7c8d1e3f5g6h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
export FIRST_SUPERUSER=admin@ROAMINGPROXY.com
export FIRST_SUPERUSER_PASSWORD=x7k9p2m4n5q8r
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export EMAIL_RESET_TOKEN_EXPIRE_HOURS=1
export POSTGRES_SERVER=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=roamingproxy
export POSTGRES_USER=app
export POSTGRES_PASSWORD=secret123
export SENTRY_DSN=
alembic "$@"
