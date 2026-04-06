# Intelligent Data Annotation Platform (IDAP)

This is an enterprise-grade MVP for image classification and intelligent pre-labeling.

## Features
- **JWT Authentication**: Secure login for Admins and Annotators.
- **Task Management**: Admins can create tasks, upload images, and assign them.
- **Annotation Workspace**: High-performance UI with keyboard shortcuts and pre-labeling.
- **AI Pre-labeling**: Simulated AI model to speed up the annotation process.
- **Quality Control**: Admin review workflow (Approve/Reject).
- **Dashboard**: Real-time statistics and data export.

## Quick Start (Local Development)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database**:
   The project uses SQLite by default for easy demonstration.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Run the App**:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## Docker Deployment

1. **Build and Run**:
   ```bash
   docker-compose up --build
   ```

## Credentials (Default)
- **Admin**: `admin@idap.ai` / `admin123`
- **Annotator**: `annotator@idap.ai` / `annotator123`
