# Configuration

This directory contains configuration files for the Greep Market frontend application.

## Environment Configuration

The `environment.ts` file centralizes all environment variable access to make it easier to manage and maintain configuration across the application.

### Available Configuration

- **API Configuration**: Base URL and socket URL for backend communication
- **Cloudinary Configuration**: Cloud name and upload preset for image uploads
- **VAPID Configuration**: Public key for push notifications
- **App Configuration**: Application name, version, and environment

### Usage

```typescript
import { api, cloudinary, vapid, app } from "../config/environment";

// Use API configuration
const response = await fetch(`${api.baseUrl}/products`);

// Use Cloudinary configuration
const cloudinaryUrl = `https://res.cloudinary.com/${cloudinary.cloudName}/image/upload/`;

// Use app configuration
console.log(`Running ${app.name} v${app.version} in ${app.environment} mode`);
```

### Environment Variables

The following environment variables are supported:

- `REACT_APP_API_URL`: Backend API base URL (default: http://localhost:5000/api/v1)
- `REACT_APP_SOCKET_URL`: WebSocket URL for real-time communication (default: http://localhost:5000)
- `REACT_APP_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name (default: dwrbtwtn5)
- `REACT_APP_CLOUDINARY_UPLOAD_PRESET`: Cloudinary upload preset (default: market_upload)
- `REACT_APP_VAPID_PUBLIC_KEY`: VAPID public key for push notifications

### Adding New Configuration

To add new configuration:

1. Add the environment variable to the `.env` file
2. Add the configuration to the `config` object in `environment.ts`
3. Export the new configuration for easy access
4. Update this README with the new configuration details
