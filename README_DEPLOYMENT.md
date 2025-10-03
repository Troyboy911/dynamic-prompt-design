# Stellarc Dynamics - Deployment Guide

## 🐳 Docker Deployment

### Building the Docker Image

```bash
docker build -t stellarc-dynamics .
```

### Running the Container

```bash
docker run -d -p 80:80 stellarc-dynamics
```

The application will be available at `http://localhost`

## ☁️ Coolify Deployment

### Prerequisites

1. A Coolify instance set up and running
2. GitHub repository connected to Coolify

### Setup Steps

1. **In Coolify Dashboard:**
   - Create a new application
   - Select "Docker" as the build pack
   - Connect your GitHub repository
   - Copy the webhook URL from Coolify

2. **In GitHub Repository Settings:**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `COOLIFY_WEBHOOK_URL`: The webhook URL from Coolify
     - `DOCKER_USERNAME`: (Optional) Your Docker Hub username
     - `DOCKER_PASSWORD`: (Optional) Your Docker Hub password

3. **Trigger Deployment:**
   - Push to main branch to trigger automatic deployment
   - Or manually trigger via Actions tab → Deploy to Coolify → Run workflow

### Environment Variables

If you need environment variables in production, add them in Coolify:
- Navigate to your application settings
- Add environment variables in the "Environment" section
- Redeploy the application

## 🤖 GitHub Actions CI/CD

The project includes an automated deployment workflow that:

1. ✅ Runs on every push to main branch
2. 🔨 Builds the application
3. 🐳 Creates a Docker image
4. 🚀 Triggers Coolify webhook for deployment
5. 📊 Provides deployment status notifications

### Workflow File

Location: `.github/workflows/deploy.yml`

### Manual Deployment

You can manually trigger deployment from GitHub:
1. Go to Actions tab
2. Select "Deploy to Coolify"
3. Click "Run workflow"
4. Select branch and confirm

## 🔧 Configuration Files

- `Dockerfile` - Multi-stage Docker build configuration
- `nginx.conf` - Nginx server configuration
- `.dockerignore` - Files to exclude from Docker build
- `.github/workflows/deploy.yml` - GitHub Actions workflow

## 📝 Notes

### About Playwright & Agentic Functions

Currently, the admin panel has placeholder UI for agent functionality. To implement actual AI agent features:

1. **Enable Lovable Cloud** (click the green button in top right)
2. **Add AI Integration:**
   - Set up edge functions for OpenAI/Perplexity API calls
   - Store API keys as secrets in Lovable Cloud
   - Update admin panel to call these edge functions

3. **For Playwright Integration:**
   - Install Playwright: `npm install -D playwright`
   - Create automation scripts in `src/automation/`
   - Integrate with the admin panel agent interface

### Security Considerations

- Never commit API keys or secrets to the repository
- Use Lovable Cloud secrets management for sensitive data
- Keep Docker images updated for security patches
- Use environment variables for configuration

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

```bash
# View logs
docker logs <container-id>

# Enter container
docker exec -it <container-id> sh
```

### Deployment Issues

1. Check GitHub Actions logs
2. Verify Coolify webhook URL is correct
3. Ensure Coolify has access to pull from GitHub
4. Check Coolify application logs

## 📚 Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Lovable Cloud Documentation](https://docs.lovable.dev/features/cloud)
