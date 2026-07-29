#!/bin/bash
set -euo pipefail

IMAGE="europe-west2-docker.pkg.dev/rome2rio-dax-dev/dax-registry/chartdb:latest"
SERVICE="r2r-chartdb"
REGION="europe-west2"

echo "==> Building image for linux/amd64..."
docker buildx build --platform linux/amd64 -t "$IMAGE" .

echo "==> Pushing image to Artifact Registry..."
docker push "$IMAGE"

echo "==> Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --max-instances 1 \
  --memory 256Mi \
  --allow-unauthenticated \
  --env-vars-file=env-vars.prod.yaml

echo "==> Done!"
