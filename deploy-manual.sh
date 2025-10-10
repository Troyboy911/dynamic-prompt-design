#!/bin/bash

# Stellarc Dynamics - Manual Deployment Script for Cloudpanel
# This script builds and prepares your application for deployment

set -e  # Exit on error

echo "🚀 Stellarc Dynamics - Cloudpanel Deployment"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Clean previous build
echo -e "${BLUE}🧹 Cleaning previous build...${NC}"
rm -rf dist
rm -f deploy.tar.gz

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Build application
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}❌ Build failed! dist folder not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Create deployment archive
echo -e "${BLUE}📦 Creating deployment archive...${NC}"
cd dist
tar -czf ../deploy.tar.gz .
cd ..

# Get archive size
SIZE=$(du -h deploy.tar.gz | cut -f1)

echo ""
echo -e "${GREEN}✅ Deployment package ready!${NC}"
echo -e "${BLUE}📊 Package size: ${SIZE}${NC}"
echo ""
echo "=============================================="
echo -e "${YELLOW}📤 Next Steps:${NC}"
echo ""
echo "1. Upload deploy.tar.gz to your VPS"
echo "   scp deploy.tar.gz user@your-vps-ip:/tmp/"
echo ""
echo "2. SSH into your VPS"
echo "   ssh user@your-vps-ip"
echo ""
echo "3. Extract to your website directory"
echo "   cd /home/[your-site]/htdocs"
echo "   tar -xzf /tmp/deploy.tar.gz"
echo ""
echo "4. Set proper permissions"
echo "   find . -type d -exec chmod 755 {} \;"
echo "   find . -type f -exec chmod 644 {} \;"
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Deployment package created successfully!${NC}"
