#!/bin/bash

echo "Run migrations"
npm run migration:run

echo "Start application"
exec npm run start:dev